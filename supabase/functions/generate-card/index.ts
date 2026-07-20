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
// Модель по умолчанию: недорогая, для текста/копирайтинга. Меняется секретом OPENAI_MODEL.
const DEFAULT_MODEL = "gpt-4o-mini";
// Для распознавания фото берём модель посильнее — она точнее «читает» картинку.
const VISION_MODEL = "gpt-4o";

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

// Ключевые слова категорий (рус + каз). Продавец лучше знает, что продаёт,
// поэтому категорию сначала ищем по его словам, а не по догадкам модели с фото.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  honey: ["мед", "мёд", "бал", "пасек", "омарт"],
  dairy: ["сыр", "курт", "ірімшік", "молоч", "айран", "кумыс", "қымыз", "сливк", "творог", "сүт"],
  bakery: ["хлеб", "выпечк", "баурсак", "нан", "печень", "торт", "тоқаш", "самса", "пирог"],
  produce: ["овощ", "фрукт", "ягод", "картоф", "яблок", "көкөніс", "жеміс", "зелен", "помидор", "огурц", "бақша"],
  meat: ["мясо", " ет", "колбас", "казы", "қазы", "шужык", "шұжық", "деликатес"],
  felt_textile: ["войлок", "киіз", "шерст", "вязан", "ткан", "текстиль", "платок", "орамал", "ковер", "кілем", "шарф", "сумк"],
  jewelry: ["украшен", "кольцо", "серьг", "браслет", "әшекей", "сырға", "зерг", "бижутер", "подвеск", "цепочк"],
  ceramics: ["керамик", "посуд", "глин", "кружк", "тарелк", "ваза", "чашк", "пиал"],
  leather: ["кожа", "кожан", "тері", "ремень", "кошел", "портмоне", "барсетк"],
  wood: ["дерев", "ағаш", "резьб", "шкатулк", "доск", "разделочн"],
  clothes: ["одежд", "кием", "плать", "рубашк", "куртк", "обув", "туфл", "көйлек", "шапан", "чапан", "камзол"],
};

/** Категория по тексту продавца. null — ни одно слово не подошло. */
function guessCategoryFromText(text: string): string | null {
  const lower = ` ${text.toLowerCase()} `;
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((word) => lower.includes(word))) return category;
  }
  return null;
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

// Модель зрения настраивается секретом OPENAI_VISION_MODEL — можно переключить
// на mini ради экономии, не трогая код. По умолчанию gpt-4o (точнее «читает» фото).
async function getVisionModel(admin: SupabaseClient): Promise<string> {
  const fromEnv = Deno.env.get("OPENAI_VISION_MODEL");
  if (fromEnv) return fromEnv;
  const { data } = await admin
    .from("app_secrets")
    .select("value")
    .eq("name", "OPENAI_VISION_MODEL")
    .maybeSingle();
  return data?.value ?? VISION_MODEL;
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
    answers?: {
      what?: string;
      madeOf?: string;
      forWhom?: string;
      desiredPrice?: number;
      freeText?: string;
    };
    lang?: string;
    audio_base64?: string;
    audio_mime?: string;
    card_title?: string;
    // practice-feedback
    marketplace?: string;
    ad?: { title?: string; category?: string; price?: string; description?: string };
    dialogue?: { question: string; answer: string }[];
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
      const visionModel = await getVisionModel(admin);

      // Подписанная ссылка на фото — по ней модель заберёт изображение
      const { data: signed, error: signError } = await admin.storage
        .from("product-photos")
        .createSignedUrl(payload.photo_path, 600);
      if (signError || !signed?.signedUrl) {
        throw new Error(`signed url: ${signError?.message}`);
      }

      const answers = payload.answers ?? {};

      // Шаг 1. Зрение. Модель смотрит на фото НЕЗАВИСИМО от слов продавца —
      // так она честно сообщает, что видит, и оценивает, насколько уверена в
      // конкретной марке/модели. Слова продавца сюда НЕ передаём, чтобы она не
      // принимала на веру «это Ferrari Enzo» и не подгоняла ответ под них.
      const profile = await chatJSON(apiKey, visionModel, [
        {
          role: "system",
          content: `Ты эксперт-товаровед. Смотри на фото и опиши только то, что РЕАЛЬНО видишь. Верни строго JSON:
{
 "category": одна из ${JSON.stringify(CATEGORIES)},
 "visible_object": "что за предмет, общими словами, по-русски",
 "recognized_make_model": "конкретная марка/модель/сорт — ТОЛЬКО если действительно уверен по фото; иначе пустая строка",
 "identity_confidence": "high | medium | low — насколько уверенно ты определил конкретную модель",
 "colors": ["основные цвета"],
 "materials_visible": ["материалы, ОДНОЗНАЧНО видимые на фото; иначе пустой массив"],
 "condition": "новое / бывшее в употреблении / не определить",
 "notable_details": ["заметные детали внешнего вида"],
 "photo_quality": "свет, фон, резкость — коротко"
}
Правила честности:
— recognized_make_model заполняй, только если уверен. Узнать «Ferrari» по логотипу и форме можно, а вот точную модель (Enzo, FXX и т.п.) по одному фото почти никогда нельзя — тогда identity_confidence="low" и модель не пиши.
— materials_visible: только очевидное (стекло банки, дерево, ткань). Не уверен — пустой массив. Не угадывай состав.
— Никогда не выдумывай год, характеристики, происхождение.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Опиши строго то, что видишь на фото." },
            { type: "image_url", image_url: { url: signed.signedUrl, detail: "high" } },
          ],
        },
      ]);

      // Шаг 2. Категория: сперва по словам продавца, иначе по фото.
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
      //  3) товар вне наших категорий и цены нет → НЕ выдумываем число, честно просим
      //     продавца указать цену (иначе выходит абсурд вроде 2,5 млн ₸ за фото машины).
      // Потолок для товаров вне наших категорий: дешёвую бытовую вещь (молоток,
      // посуду) оценить можно, а дорогую/неопределённую (машину, технику) — нет.
      const OTHER_CEILING = 150000;
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

      // Шаг 3. Копирайтинг + пост. Материалы и суть — из слов продавца; вид — из фото.
      const card = await chatJSON(apiKey, model, [
        {
          role: "system",
          content: `Ты пишешь карточки товаров для мастеров и фермеров Казахстана. Пиши тепло и по-человечески, как рассказал бы сам продавец соседу. Запрещены штампы: "уникальный", "идеальный", "непревзойдённый", "изысканный", "настоящий шедевр", "порадуйте себя". Не начинай описание со слов "Этот" или "Данный".

Что откуда берёшь:
— СУТЬ товара (что это, назначение) — из ответов продавца.
— МОДЕЛЬ / МАРКА / СОРТ — указывай, ТОЛЬКО если продавец сам её назвал в ответах ИЛИ если в профиле recognized_make_model не пустой и identity_confidence="high". Во всех остальных случаях НЕ пиши конкретную модель — опиши обобщённо и честно (например, «красный спортивный автомобиль», а не «Ferrari Enzo»). Никогда не добавляй год, мощность, характеристики, происхождение, которых нет в словах продавца.
— МАТЕРИАЛ — только из ответа продавца «из чего сделано» или из materials_visible на фото. Не подтверждён — НЕ называй и не угадывай (не пиши «пластик», «металл», «карбон» наугад).
— ВНЕШНИЙ ВИД (цвет, форма, подача) — из профиля с фото.
Никогда не выдумывай факты, которых нет ни в словах продавца, ни на фото. Лучше короче и честнее, чем красиво и неправда.

Верни строго JSON:
{
 "title_ru": "заголовок до 70 знаков, по-русски",
 "title_kz": "тот же заголовок по-казахски",
 "description_ru": "описание 300-500 знаков, по-русски",
 "description_kz": "то же описание по-казахски",
 "tags": ["6-8 тегов без #: половина по-русски, половина по-казахски"],
 "price_recommended": целое число в тенге,
 "price_min": целое, "price_max": целое,
 "price_rationale": "2-3 предложения на ${lang === "kz" ? "казахском" : "русском"}",
 "social_post": "готовый пост для WhatsApp на ${lang === "kz" ? "казахском" : "русском"}: 2-4 коротких абзаца, 1-2 эмодзи, цена, в конце призыв написать продавцу${sellerPhone ? ` и его номер ${sellerPhone}` : ""}"
}

Про цену: ${priceInstruction}`,
        },
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

      // Цену фиксируем на сервере — не полагаемся на то, что вернула модель.
      if (desired) {
        card.price_recommended = desired;
        card.price_is_user_set = true;
        card.price_unknown = false;
      } else if (knownCategory) {
        // Зажимаем предложение модели в рыночный диапазон — 2,5 млн за мёд невозможно.
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
        // Товар вне категорий: доверяем решению модели. Дала разумное число в
        // пределах потолка — берём; вернула 0 или что-то запредельное — честно
        // просим цену у продавца (чтобы не выдумать 2,5 млн за фото машины).
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

    /* ===== Разбор тренировки в симуляторе ===== */
    if (payload.action === "practice-feedback") {
      if (!payload.dialogue || payload.dialogue.length === 0) {
        return jsonResponse({ code: "bad_request" }, 400);
      }

      const model = await getModel(admin);
      const isKz = lang === "kz";

      const analysis = await chatJSON(apiKey, model, [
        {
          role: "system",
          content: `Ты наставник по онлайн-продажам для начинающих продавцов Казахстана, многим из них за 50. Ученик потренировался в симуляторе маркетплейса: заполнил объявление и ответил на вопросы «покупателя». Разбери его работу тепло и по-доброму, как терпеливый учитель — хвали конкретное, поправляй мягко, без канцелярита.

Оцени: вежливость и скорость смысла в ответах, работу с торгом, честность, конкретику про доставку и встречу, качество объявления (название, описание, цена).

Верни строго JSON на ${isKz ? "казахском" : "русском"} языке:
{
 "score": целое 1-10,
 "feedback": "2-3 предложения: что получилось хорошо и что главное подтянуть",
 "tip": "один конкретный совет на следующую тренировку, одним предложением"
}`,
        },
        {
          role: "user",
          content: `Площадка: ${payload.marketplace ?? "-"}
Объявление ученика:
— Название: ${payload.ad?.title ?? "-"}
— Категория: ${payload.ad?.category ?? "-"}
— Цена: ${payload.ad?.price ?? "-"} тг
— Описание: ${payload.ad?.description ?? "-"}

Переписка (вопрос покупателя → ответ ученика):
${payload.dialogue.map((d, i) => `${i + 1}. «${d.question}» → «${d.answer}»`).join("\n")}`,
        },
      ]);

      const score = Math.min(10, Math.max(1, Math.round(Number(analysis.score) || 5)));
      return jsonResponse(
        {
          score,
          feedback: String(analysis.feedback ?? ""),
          tip: String(analysis.tip ?? ""),
        },
        200
      );
    }

    return jsonResponse({ code: "bad_action" }, 400);
  } catch (err) {
    console.error("generate-card error:", (err as Error).message);
    return jsonResponse({ code: "server" }, 500);
  }
});
