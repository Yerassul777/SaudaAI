/*
  api.ts — все обращения приложения к бэкенду в одном месте:
  загрузка фото в Storage, вызовы ИИ-функции generate-card,
  чтение и запись карточек в таблицу cards.
*/
import { supabase } from "./supabase";
import type { Lang } from "../content";

/* ===== Типы ===== */

export type Answers = {
  what: string;
  madeOf: string;
  forWhom: string;
  /** Свободный рассказ продавца (обычно из голосового ввода) */
  freeText?: string;
};

/** Ответ ИИ-цепочки: тексты, цена, пост */
export type GeneratedCard = {
  title_ru: string;
  title_kz: string;
  description_ru: string;
  description_kz: string;
  tags: string[];
  price_recommended: number;
  price_min: number;
  price_max: number;
  price_rationale: string;
  social_post: string;
};

/** Строка таблицы cards */
export type CardRow = GeneratedCard & {
  id: string;
  user_id: string;
  photo_path: string | null;
  generated_photo_path: string | null;
  category: string | null;
  answers: Answers | null;
  created_at: string;
};

/* ===== Фото ===== */

/** Загружает фото в папку пользователя, возвращает путь в бакете. */
export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from("product-photos")
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

/** Подписанная ссылка, чтобы показать фото в интерфейсе (бакет приватный). */
export async function getPhotoUrl(
  bucket: "product-photos" | "generated-images",
  path: string
): Promise<string | null> {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/* ===== ИИ-функция generate-card ===== */

export async function generateCard(
  photoPath: string,
  answers: Answers,
  lang: Lang
): Promise<{ card: GeneratedCard; category: string }> {
  const { data, error } = await supabase.functions.invoke("generate-card", {
    body: { action: "card", photo_path: photoPath, answers, lang },
  });
  if (error) throw new Error("generate failed");
  return { card: data.card as GeneratedCard, category: data.category as string };
}

export async function transcribeAudio(
  audioBase64: string,
  mime: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-card", {
    body: { action: "transcribe", audio_base64: audioBase64, audio_mime: mime },
  });
  if (error) throw new Error("transcribe failed");
  return (data.text as string) ?? "";
}

export async function generateImage(
  photoPath: string,
  cardTitle: string
): Promise<{ path: string; url: string | null }> {
  const { data, error } = await supabase.functions.invoke("generate-card", {
    body: { action: "image", photo_path: photoPath, card_title: cardTitle },
  });
  if (error) throw new Error("image failed");
  return data as { path: string; url: string | null };
}

/* ===== Таблица cards ===== */

export async function saveCard(input: {
  userId: string;
  photoPath: string;
  generatedPhotoPath: string | null;
  category: string;
  answers: Answers;
  card: GeneratedCard;
}): Promise<void> {
  const { error } = await supabase.from("cards").insert({
    user_id: input.userId,
    photo_path: input.photoPath,
    generated_photo_path: input.generatedPhotoPath,
    category: input.category,
    answers: input.answers,
    title_ru: input.card.title_ru,
    title_kz: input.card.title_kz,
    description_ru: input.card.description_ru,
    description_kz: input.card.description_kz,
    tags: input.card.tags,
    price_recommended: input.card.price_recommended,
    price_min: input.card.price_min,
    price_max: input.card.price_max,
    price_rationale: input.card.price_rationale,
    social_post: input.card.social_post,
  });
  if (error) throw new Error(error.message);
}

export async function listCards(): Promise<CardRow[]> {
  // RLS отдаёт только карточки текущего пользователя
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CardRow[];
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
