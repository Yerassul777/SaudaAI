/*
  Всё общение с OpenAI собрано здесь.

  Наружу отдаём четыре функции по числу моделей, которые использует продукт:
  chatJSON (текст и зрение), transcribe (whisper), editImage (gpt-image-1).
  Ключ и названия моделей читаются из секретов функции, а если их там нет,
  из таблицы app_secrets, недоступной из браузера. На клиент ключ не попадает
  никогда.
*/
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const OPENAI_URL = "https://api.openai.com/v1";

// Модель по умолчанию: недорогая, для текста и копирайтинга. Меняется секретом OPENAI_MODEL.
const DEFAULT_MODEL = "gpt-4o-mini";
// Для распознавания фото берём модель посильнее: она точнее «читает» картинку.
const VISION_MODEL = "gpt-4o";

/** Значение секрета: сперва окружение, иначе таблица app_secrets. */
async function secret(
  admin: SupabaseClient,
  name: string
): Promise<string | null> {
  const fromEnv = Deno.env.get(name);
  if (fromEnv) return fromEnv;
  const { data } = await admin
    .from("app_secrets")
    .select("value")
    .eq("name", name)
    .maybeSingle();
  return data?.value ?? null;
}

export async function getOpenAIKey(admin: SupabaseClient): Promise<string | null> {
  return await secret(admin, "OPENAI_API_KEY");
}

export async function getModel(admin: SupabaseClient): Promise<string> {
  return (await secret(admin, "OPENAI_MODEL")) ?? DEFAULT_MODEL;
}

// Модель зрения настраивается секретом OPENAI_VISION_MODEL: можно переключить
// на mini ради экономии, не трогая код.
export async function getVisionModel(admin: SupabaseClient): Promise<string> {
  return (await secret(admin, "OPENAI_VISION_MODEL")) ?? VISION_MODEL;
}

/** Вызов Chat Completions с ответом строго в JSON. */
export async function chatJSON(
  apiKey: string,
  model: string,
  messages: unknown[],
  temperature = 0.7
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
      temperature,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/** Голосовая запись → текст. */
export async function transcribe(
  apiKey: string,
  audio: Uint8Array,
  mime: string
): Promise<string> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([audio], { type: mime }),
    mime.includes("mp4") ? "audio.mp4" : "audio.webm"
  );
  form.append("model", "whisper-1");
  // Подсказка повышает точность на казахских названиях и на тенге
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
  return (data.text as string) ?? "";
}

/** Фото товара → «студийный» вариант. Возвращает base64 картинки. */
export async function editImage(
  apiKey: string,
  original: Blob,
  prompt: string
): Promise<string> {
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image", original, "product.png");
  form.append("prompt", prompt);
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
  return b64 as string;
}
