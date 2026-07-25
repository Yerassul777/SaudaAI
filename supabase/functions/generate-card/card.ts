/*
  Цепочка карточки товара. Три шага, а не одна обёртка над API:

  1. Зрение. Модель смотрит на фото и извлекает структуру: категория, цвета,
     материалы, уверенность в распознавании. Слова продавца сюда не попадают,
     чтобы модель не подгоняла ответ под них.
  2. Ценовой якорь. По категории берём диапазон из таблицы price_ranges.
     Категорию ищем сначала по словам продавца: он лучше знает, что продаёт.
  3. Копирайтинг. Профиль с фото + ответы продавца + инструкция по цене →
     тексты на двух языках, теги, цена с обоснованием, пост для WhatsApp.

  Цену после ответа модели ещё раз фиксирует сервер: доверять числу из модели
  нельзя, ошибка в цене стоит продавцу денег.
*/
import type { SupabaseClient, User } from "npm:@supabase/supabase-js@2";
import { chatJSON, getModel, getVisionModel } from "./openai.ts";
import { cardPrompt, VISION_PROMPT } from "./prompts.ts";
import {
  CATEGORIES,
  guessCategoryFromText,
  jsonResponse,
  type Lang,
  type Payload,
} from "./shared.ts";

/*
  Потолок для товаров вне наших категорий. Дешёвую бытовую вещь (молоток,
  посуду) оценить можно, а дорогую или неопределённую (машину, технику) нет:
  лучше честно попросить цену у продавца, чем выдать 2,5 млн ₸ за фото машины.
*/
const OTHER_CEILING = 150000;

export async function handleCard(
  admin: SupabaseClient,
  user: User,
  apiKey: string,
  payload: Payload,
  lang: Lang
): Promise<Response> {
  if (!payload.photo_path) return jsonResponse({ code: "bad_request" }, 400);
  // Пользователь может работать только со своей папкой
  if (!payload.photo_path.startsWith(`${user.id}/`)) {
    return jsonResponse({ code: "forbidden" }, 403);
  }

  const model = await getModel(admin);
  const visionModel = await getVisionModel(admin);

  // Подписанная ссылка на фото: по ней модель заберёт изображение
  const { data: signed, error: signError } = await admin.storage
    .from("product-photos")
    .createSignedUrl(payload.photo_path, 600);
  if (signError || !signed?.signedUrl) {
    throw new Error(`signed url: ${signError?.message}`);
  }

  const answers = payload.answers ?? {};

  /* ===== Шаг 1. Зрение ===== */
  const profile = await chatJSON(apiKey, visionModel, [
    { role: "system", content: VISION_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: "Опиши строго то, что видишь на фото." },
        { type: "image_url", image_url: { url: signed.signedUrl, detail: "high" } },
      ],
    },
  ]);

  /* ===== Шаг 2. Категория и ценовой якорь ===== */
  const sellerText = `${answers.what ?? ""} ${answers.madeOf ?? ""} ${answers.freeText ?? ""}`;
  const visionCategory = CATEGORIES.includes(profile.category as never)
    ? (profile.category as string)
    : "other";
  const category = guessCategoryFromText(sellerText) ?? visionCategory;

  const { data: range } = await admin
    .from("price_ranges")
    .select("min_kzt, max_kzt, note")
    .eq("category", category)
    .maybeSingle();

  const sellerPhone = (user.user_metadata?.phone as string) ?? "";
  const sellerName = (user.user_metadata?.name as string) ?? "";

  const desired =
    typeof answers.desiredPrice === "number" && answers.desiredPrice > 0
      ? answers.desiredPrice
      : null;

  // Три ситуации с ценой:
  //  1) продавец назвал цену → уважаем её, ИИ только советует;
  //  2) категория известна (мёд, войлок…) → предлагаем внутри рыночного диапазона;
  //  3) товар вне наших категорий и цены нет → просим оценку у модели, но
  //     решение показывать её или нет принимает сервер ниже.
  const knownCategory = category !== "other" && Boolean(range);
  const marketHint = range
    ? `Рыночный ориентир для похожих товаров: ${range.min_kzt}–${range.max_kzt} тг (${range.note}).`
    : "";

  let priceInstruction: string;
  if (desired) {
    priceInstruction = `Продавец назвал свою цену: ${desired} тг. НЕ меняй её — в price_recommended верни ровно ${desired}. ${marketHint} В price_rationale дай короткий совет: в рынке ли цена, стоит ли поднять или снизить и почему.`;
  } else if (knownCategory) {
    priceInstruction = `Продавец цену не назвал. Предложи стартовую цену как ОРИЕНТИР, строго внутри диапазона ${range!.min_kzt}–${range!.max_kzt} тг, сдвигая за ручную работу, натуральность, сложность. В price_rationale честно скажи, что это отправная точка.`;
  } else {
    priceInstruction = `Товар вне наших базовых категорий. Дай свою честную рыночную оценку для такого товара в Казахстане: price_recommended — реалистичная средняя цена в тенге, price_min и price_max — вилка вокруг неё. Оценивай как есть, даже если товар дорогой (машина, техника) — не занижай и не ставь 0, сервер сам решит, показать это число или попросить цену у продавца. В price_rationale по-${lang === "kz" ? "казахски" : "русски"} скажи, что это лишь ориентир, и предложи продавцу поправить цену.`;
  }

  /* ===== Шаг 3. Копирайтинг ===== */
  const card = await chatJSON(apiKey, model, [
    { role: "system", content: cardPrompt(lang, sellerPhone, priceInstruction) },
    {
      role: "user",
      content: `Профиль с фото (внешний вид): ${JSON.stringify(profile)}
Ответы продавца${sellerName ? ` (${sellerName})` : ""} — это про СУТЬ товара:
— Что это: ${answers.what ?? "-"}
— Из чего сделано: ${answers.madeOf ?? "-"}
— Для кого/для чего: ${answers.forWhom ?? "-"}
${answers.freeText ? `— Рассказ продавца своими словами: ${answers.freeText}` : ""}`,
    },
  ]);

  /* ===== Цену фиксирует сервер, а не модель ===== */
  if (desired) {
    card.price_recommended = desired;
    card.price_is_user_set = true;
    card.price_unknown = false;
  } else if (knownCategory) {
    // Зажимаем предложение модели в рыночный диапазон: 2,5 млн за мёд невозможно
    const lo = range!.min_kzt;
    const hi = range!.max_kzt;
    const clamp = (n: unknown) =>
      Math.min(hi, Math.max(lo, Math.round(Number(n) || lo)));
    card.price_recommended = clamp(card.price_recommended);
    card.price_min = lo;
    card.price_max = hi;
    card.price_is_user_set = false;
    card.price_unknown = false;
  } else {
    // Вне категорий: разумное число в пределах потолка берём, иначе честно
    // просим цену у продавца вместо выдуманного числа
    const rec = Math.round(Number(card.price_recommended) || 0);
    if (rec <= 0 || rec > OTHER_CEILING) {
      card.price_recommended = 0;
      card.price_min = 0;
      card.price_max = 0;
      card.price_is_user_set = false;
      card.price_unknown = true;
    } else {
      card.price_recommended = rec;
      card.price_min = Math.round(Number(card.price_min) || Math.round(rec * 0.7));
      card.price_max = Math.round(Number(card.price_max) || Math.round(rec * 1.4));
      card.price_is_user_set = false;
      card.price_unknown = false;
    }
  }

  return jsonResponse({ profile, category, card }, 200);
}
