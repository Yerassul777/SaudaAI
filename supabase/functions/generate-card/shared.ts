/*
  Общее для всех действий функции: ответы HTTP, категории товаров,
  приведение того, что вернула модель, к нашим типам.

  Здесь нет ни одного вызова OpenAI и ни одного запроса к базе, поэтому файл
  можно читать и проверять отдельно от остальной логики.
*/

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ===== Категории товаров ===== */

export const CATEGORIES = [
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
export function guessCategoryFromText(text: string): string | null {
  const lower = ` ${text.toLowerCase()} `;
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((word) => lower.includes(word))) return category;
  }
  return null;
}

/* ===== Тренажёр ===== */

// Пять умений тренажёра. Порядок важен: по этим же ключам страница прогресса
// строит полосы и сравнивает тренировки между собой.
export const SKILL_KEYS = [
  "greeting",
  "clarity",
  "bargaining",
  "delivery",
  "adQuality",
];

/*
  Темы реплик покупателя. Порядок задан методикой и НЕ отдан модели:
  каждая тема кормит своё умение в рубрике разбора. Если позволить покупателю
  выбирать тему самому, он может ни разу не спросить про доставку, и оценивать
  умение "delivery" будет не по чему.

  Модель сочиняет только формулировку вопроса на заданную тему, с учётом
  объявления и того, что продавец уже ответил.
*/
export const BUYER_TOPICS = [
  "приветствие и наличие товара",
  "торг: попросить уступить в цене",
  "состояние и подробности товара",
  "доставка или самовывоз",
  "сомнение в цене: у других дешевле",
] as const;

export const MAX_BUYER_TURNS = BUYER_TOPICS.length;

/*
  Предел длины реплики покупателя. Живой покупатель в чате пишет коротко.
  Всё длиннее считаем сбоем роли (модель ушла в объяснения или поддалась на
  просьбу продавца сделать что-то постороннее) и подставляем заготовку.
*/
export const MAX_BUYER_MESSAGE = 200;

/* ===== Приведение ответа модели ===== */

/** Балл 1-10 из чего угодно, что вернула модель. Мусор заменяем на fallback. */
export function clampScore(value: unknown, fallback: number): number {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(10, Math.max(1, number));
}

/** Первые два элемента массива; не массив — пустой список. */
export function toShortList(value: unknown): unknown[] {
  return Array.isArray(value) ? value.slice(0, 2) : [];
}

/* ===== Типы запроса ===== */

export type Lang = "ru" | "kz";

export type SellerAnswers = {
  what?: string;
  madeOf?: string;
  forWhom?: string;
  desiredPrice?: number;
  freeText?: string;
};

/** Объявление, которое ученик заполнил в тренажёре. */
export type Ad = {
  title?: string;
  category?: string;
  price?: string;
  description?: string;
};

/** Одна реплика чата тренажёра. */
export type ChatTurn = { from: "buyer" | "me"; text: string };

export type Payload = {
  action?: string;
  lang?: string;
  // card / image
  photo_path?: string;
  answers?: SellerAnswers;
  card_title?: string;
  // transcribe
  audio_base64?: string;
  audio_mime?: string;
  // тренажёр
  marketplace?: string;
  ad?: Ad;
  /** Поля, которых нет у всех площадок: состояние, бренд, габариты и т.п. */
  extra?: { label: string; value: string }[];
  /** Вся переписка целиком: покупатель отвечает с учётом того, что было раньше */
  chat?: ChatTurn[];
  /** Пары «вопрос покупателя → ответ ученика» для итогового разбора */
  dialogue?: { question: string; answer: string }[];
};
