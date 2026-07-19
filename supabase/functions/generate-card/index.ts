/*
  generate-card — ИИ-ядро Sauda AI. Одна функция, три действия:

  action: "card"       фото + ответы продавца → готовая карточка товара
  action: "transcribe" голосовая запись → текст (для тех, кто не хочет печатать)
  action: "image"      фото товара → чистое «студийное» фото для маркетплейса

  Как собирается карточка (многошаговая цепочка, а не одна обёртка над API):
  1. Зрение. Модель смотрит на фото и извлекает структуру: категория,
     материалы, цвета, признаки ручной работы. Строгий JSON.
  2. Цена-якорь. По категории берём диапазон из таблицы price_ranges
     (собранной по открытым объявлениям Satu/Kaspi/OLX) — это алгоритмическая
     привязка, чтобы модель не фантазировала цену с потолка.
  3. Копирайтинг. Профиль из шага 1 + ответы продавца + ценовой якорь →
     заголовок и описание на русском и казахском, теги, цена с обоснованием
     и готовый пост для WhatsApp.

  Ключ OpenAI живёт в секретах функции (или в таблице app_secrets,
  недоступной из браузера) и никогда не попадает на клиент.
*/
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OPENAI_URL = "https://api.openai.com/v1";
// Модель по умолчанию: недорогая, со зрением. Меняется секретом OPENAI_MODEL.
const DEFAULT_MODEL = "gpt-4o-mini";

const CATEGORIES = [
  "felt_textile",
  "jewelry",
  "ceramics",
  "leather",
  "wood",
  "honey",
  "dairy",
  "bakery",
  "produce",
  "meat",
  "clothes",
  "other",
] as const;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Ключ OpenAI: сначала из секретов окружения, иначе из таблицы app_secrets. */
async function getOpenAIKey(admin: SupabaseClient): Promise<string | null> {
  const fromEnv = Deno.env.get("OPENAI_API_KEY");
  if (fromEnv) return fromEnv;
  const { data } = await admin
    .from("app_secrets")
    .select("value")
    .eq("name", "OPENAI_API_KEY")
    .maybeSingle();
  return data?.value ?? null;
}

async function getModel(admin: SupabaseClient): Promise<string> {
  const fromEnv = Deno.env.get("OPENAI_MODEL");
  if (fromEnv) return fromEnv;
  const { data } = await admin
    .from("app_secrets")
    .select("value")
    .eq("name", "OPENAI_MODEL")
    .maybeSingle();
  return data?.value ?? DEFAULT_MODEL;
}

/** Вызов Chat Completions с ответом строго в JSON. */
async function chatJSON(
  apiKey: string,
  model: string,
  messages: unknown[]
): Promise<Record<string, unknown>> {
  const res = await fetch(`${OPENAI_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

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

  let payload: {
    action?: string;
    photo_path?: string;
    answers?: { what?: string; madeOf?: string; forWhom?: string; freeText?: string };
    lang?: string;
    audio_base64?: string;
    audio_mime?: string;
    card_title?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ code: "bad_request" }, 400);
  }

  const apiKey = await getOpenAIKey(admin);
  if (!apiKey) {
    return jsonResponse({ code: "no_api_key" }, 500);
  }
  const lang = payload.lang === "kz" ? "kz" : "ru";

  try {
    /* ===== Голос → текст ===== */
    if (payload.action === "transcribe") {
      if (!payload.audio_base64) return jsonResponse({ code: "bad_request" }, 400);

      const binary = Uint8Array.from(atob(payload.audio_base64), (c) =>
        c.charCodeAt(0)
      );
      const mime = payload.audio_mime ?? "audio/webm";
      const form = new FormData();
      form.append(
        "file",
        new Blob([binary], { type: mime }),
        mime.includes("mp4") ? "audio.mp4" : "audio.webm"
      );
      form.append("model", "whisper-1");
      // Подсказка повышает точность на казахских названиях и теньге
      form.append(
        "prompt",
        "Продавец из Казахстана описывает свой товар: что это, из чего сделано, для кого, цена в тенге. Может говорить по-русски или по-казахски."
      );

      const res = await fetch(`${OPENAI_URL}/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
      }
      const data = await res.json();
      return jsonResponse({ text: data.text ?? "" }, 200);
    }

    /* ===== Фото + ответы → карточка ===== */
    if (payload.action === "card") {
      if (!payload.photo_path) return jsonResponse({ code: "bad_request" }, 400);
      // Пользователь может работать только со своей папкой
      if (!payload.photo_path.startsWith(`${user.id}/`)) {
        return jsonResponse({ code: "forbidden" }, 403);
      }

      const model = await getModel(admin);

      // Подписанная ссылка на фото — по ней модель заберёт изображение
      const { data: signed, error: signError } = await admin.storage
        .from("product-photos")
        .createSignedUrl(payload.photo_path, 600);
      if (signError || !signed?.signedUrl) {
        throw new Error(`signed url: ${signError?.message}`);
      }

      const answersEarly = payload.answers ?? {};

      // Шаг 1. Зрение: структура товара из фото.
      // Слова продавца передаём как подсказку: он знает свой товар лучше модели.
      const sellerHint = [answersEarly.what, answersEarly.freeText]
        .filter(Boolean)
        .join(". ");
      const profile = await chatJSON(apiKey, model, [
        {
          role: "system",
          content: `Ты товаровед казахстанского маркетплейса. Изучи фото товара и верни строго JSON:
{
 "category": одна из ${JSON.stringify(CATEGORIES)},
 "product_type": "что это, коротко, по-русски",
 "materials": ["видимые материалы"],
 "colors": ["основные цвета"],
 "style": "стиль/впечатление в 3-5 словах",
 "handmade_signals": ["видимые признаки ручной работы, если есть"],
 "photo_quality": "краткая оценка фото: свет, фон, резкость"
}
Продавец сам говорит, что это за товар — его словам верь больше, чем догадкам по картинке: категорию и product_type выбирай в первую очередь по его описанию. С фото бери видимые детали: цвета, материалы, стиль. Не выдумывай того, чего не видно. Если категория неясна даже со слов продавца — "other".`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: sellerHint
                ? `Продавец говорит: ${sellerHint}`
                : "Продавец описание не дал — определи по фото.",
            },
            { type: "image_url", image_url: { url: signed.signedUrl, detail: "low" } },
          ],
        },
      ]);

      // Шаг 2. Ценовой якорь по категории
      const category = CATEGORIES.includes(profile.category as never)
        ? (profile.category as string)
        : "other";
      const { data: range } = await admin
        .from("price_ranges")
        .select("min_kzt, max_kzt, note")
        .eq("category", category)
        .maybeSingle();

      const answers = answersEarly;
      const sellerPhone = (user.user_metadata?.phone as string) ?? "";
      const sellerName = (user.user_metadata?.name as string) ?? "";

      // Шаг 3. Копирайтинг + цена + пост
      const card = await chatJSON(apiKey, model, [
        {
          role: "system",
          content: `Ты пишешь карточки товаров для мастеров и фермеров Казахстана. Главный источник правды — ответы продавца: карточка описывает именно тот товар, который он назвал. Профиль с фото используй только для живых деталей (цвет, вид, подача), а при противоречии всегда верь продавцу. Пиши тепло и по-человечески, как рассказал бы сам продавец соседу. Запрещены штампы: "уникальный", "идеальный", "непревзойдённый", "изысканный", "настоящий шедевр", "порадуйте себя". Не начинай описание со слов "Этот" или "Данный". Конкретика важнее эпитетов: материал, вкус, размер, как использовать, как хранить.

Верни строго JSON:
{
 "title_ru": "заголовок до 70 знаков, по-русски",
 "title_kz": "тот же заголовок по-казахски",
 "description_ru": "описание 300-500 знаков, по-русски",
 "description_kz": "то же описание по-казахски",
 "tags": ["6-8 тегов без #: половина по-русски, половина по-казахски"],
 "price_recommended": целое число в тенге,
 "price_min": целое, "price_max": целое,
 "price_rationale": "2-3 предложения, почему такая цена, на ${lang === "kz" ? "казахском" : "русском"}",
 "social_post": "готовый пост для WhatsApp на ${lang === "kz" ? "казахском" : "русском"}: 2-4 коротких абзаца, 1-2 эмодзи, цена, в конце призыв написать продавцу${sellerPhone ? ` и его номер ${sellerPhone}` : ""}"
}

Цену держи внутри рыночного диапазона категории${range ? ` (${range.min_kzt}–${range.max_kzt} тг, ${range.note})` : ""}, сдвигая внутри него за ручную работу, натуральность, сложность — и объясни сдвиг в price_rationale.`,
        },
        {
          role: "user",
          content: `Профиль товара с фото: ${JSON.stringify(profile)}
Ответы продавца${sellerName ? ` (${sellerName})` : ""}:
— Что это: ${answers.what ?? "-"}
— Из чего сделано: ${answers.madeOf ?? "-"}
— Для кого/для чего: ${answers.forWhom ?? "-"}
${answers.freeText ? `— Рассказ продавца своими словами: ${answers.freeText}` : ""}`,
        },
      ]);

      return jsonResponse({ profile, category, card }, 200);
    }

    /* ===== «Красивое фото» ===== */
    if (payload.action === "image") {
      if (!payload.photo_path) return jsonResponse({ code: "bad_request" }, 400);
      if (!payload.photo_path.startsWith(`${user.id}/`)) {
        return jsonResponse({ code: "forbidden" }, 403);
      }

      // Скачиваем оригинал из Storage
      const { data: original, error: downloadError } = await admin.storage
        .from("product-photos")
        .download(payload.photo_path);
      if (downloadError || !original) {
        throw new Error(`download: ${downloadError?.message}`);
      }

      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("image", original, "product.png");
      form.append(
        "prompt",
        `Профессиональное студийное фото этого же товара для маркетплейса: мягкий рассеянный свет, чистый нейтральный фон тёплого оттенка, товар в центре, без надписей и водяных знаков. Сам товар не менять: форма, цвет и детали как на оригинале.${
          payload.card_title ? ` Товар: ${payload.card_title}.` : ""
        }`
      );
      form.append("size", "1024x1024");

      const res = await fetch(`${OPENAI_URL}/images/edits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
      }
      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error("image: empty response");

      // Кладём результат в generated-images/{uid}/... и отдаём подписанную ссылку
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const path = `${user.id}/${Date.now()}.png`;
      const { error: uploadError } = await admin.storage
        .from("generated-images")
        .upload(path, bytes, { contentType: "image/png" });
      if (uploadError) throw new Error(`upload: ${uploadError.message}`);

      const { data: signedResult } = await admin.storage
        .from("generated-images")
        .createSignedUrl(path, 3600);

      return jsonResponse(
        { path, url: signedResult?.signedUrl ?? null },
        200
      );
    }

    return jsonResponse({ code: "bad_action" }, 400);
  } catch (err) {
    console.error("generate-card error:", (err as Error).message);
    return jsonResponse({ code: "server" }, 500);
  }
});
