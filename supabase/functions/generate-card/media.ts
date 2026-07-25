/*
  Два действия вокруг медиа: расшифровка голоса и «студийное» фото товара.

  Голос нужен, потому что печатать наша аудитория не любит и часто не умеет
  быстро. Студийное фото вынесено в отдельную кнопку, а не в общую цепочку:
  генерация картинки в шесть раз дороже всей остальной работы над карточкой,
  и платить за неё каждый раз незачем.
*/
import type { SupabaseClient, User } from "npm:@supabase/supabase-js@2";
import { editImage, transcribe } from "./openai.ts";
import { studioPhotoPrompt } from "./prompts.ts";
import { jsonResponse, type Payload } from "./shared.ts";

export async function handleTranscribe(
  apiKey: string,
  payload: Payload
): Promise<Response> {
  if (!payload.audio_base64) return jsonResponse({ code: "bad_request" }, 400);

  const binary = Uint8Array.from(atob(payload.audio_base64), (c) =>
    c.charCodeAt(0)
  );
  const text = await transcribe(
    apiKey,
    binary,
    payload.audio_mime ?? "audio/webm"
  );
  return jsonResponse({ text }, 200);
}

export async function handleImage(
  admin: SupabaseClient,
  user: User,
  apiKey: string,
  payload: Payload
): Promise<Response> {
  if (!payload.photo_path) return jsonResponse({ code: "bad_request" }, 400);
  if (!payload.photo_path.startsWith(`${user.id}/`)) {
    return jsonResponse({ code: "forbidden" }, 403);
  }

  const { data: original, error: downloadError } = await admin.storage
    .from("product-photos")
    .download(payload.photo_path);
  if (downloadError || !original) {
    throw new Error(`download: ${downloadError?.message}`);
  }

  const b64 = await editImage(
    apiKey,
    original,
    studioPhotoPrompt(payload.card_title ?? "")
  );

  // Результат кладём в generated-images/{uid}/… и отдаём подписанную ссылку
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const path = `${user.id}/${Date.now()}.png`;
  const { error: uploadError } = await admin.storage
    .from("generated-images")
    .upload(path, bytes, { contentType: "image/png" });
  if (uploadError) throw new Error(`upload: ${uploadError.message}`);

  const { data: signedResult } = await admin.storage
    .from("generated-images")
    .createSignedUrl(path, 3600);

  return jsonResponse({ path, url: signedResult?.signedUrl ?? null }, 200);
}
