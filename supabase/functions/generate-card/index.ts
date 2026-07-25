/*
  generate-card — ИИ-ядро Sauda AI.

  Этот файл занимается только тремя вещами: проверяет, кто пришёл, разбирает
  запрос и передаёт работу нужному обработчику. Сама логика лежит по соседству,
  каждая часть отдельно:

    shared.ts    типы, категории товаров, приведение ответа модели
    openai.ts    единственное место, где продукт ходит в OpenAI
    prompts.ts   все системные промпты
    card.ts      цепочка карточки: зрение → ценовой якорь → копирайтинг
    media.ts     расшифровка голоса и «студийное» фото
    practice.ts  тренажёр: реплики покупателя и разбор по пяти умениям

  Действия:
    card              фото + ответы продавца → готовая карточка
    transcribe        голосовая запись → текст
    image             фото товара → «студийное» фото
    practice-reply    очередная реплика покупателя в тренажёре
    practice-feedback разбор тренировки по рубрике из пяти умений

  Ключ OpenAI живёт в секретах функции (или в таблице app_secrets, недоступной
  из браузера) и никогда не попадает на клиент.
*/
import { createClient } from "npm:@supabase/supabase-js@2";
import { getOpenAIKey } from "./openai.ts";
import { handleCard } from "./card.ts";
import { handleImage, handleTranscribe } from "./media.ts";
import { handleBuyerReply, handlePracticeFeedback } from "./practice.ts";
import {
  corsHeaders,
  jsonResponse,
  type Lang,
  type Payload,
} from "./shared.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey);

  // Пользователь из JWT (сам токен платформа уже проверила: verify_jwt=true)
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) {
    return jsonResponse({ code: "unauthorized" }, 401);
  }
  const user = userData.user;

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ code: "bad_request" }, 400);
  }

  const apiKey = await getOpenAIKey(admin);
  if (!apiKey) {
    return jsonResponse({ code: "no_api_key" }, 500);
  }
  const lang: Lang = payload.lang === "kz" ? "kz" : "ru";

  try {
    switch (payload.action) {
      case "transcribe":
        return await handleTranscribe(apiKey, payload);
      case "card":
        return await handleCard(admin, user, apiKey, payload, lang);
      case "image":
        return await handleImage(admin, user, apiKey, payload);
      case "practice-reply":
        return await handleBuyerReply(admin, apiKey, payload, lang);
      case "practice-feedback":
        return await handlePracticeFeedback(admin, apiKey, payload, lang);
      default:
        return jsonResponse({ code: "bad_action" }, 400);
    }
  } catch (err) {
    console.error("generate-card error:", (err as Error).message);
    return jsonResponse({ code: "server" }, 500);
  }
});
