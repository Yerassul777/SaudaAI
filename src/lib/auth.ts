/*
  Вход по номеру телефона и 4-значному ПИНу.

  Почему так: наша аудитория — мастера и фермеры, многим за 50. Почта и длинный
  пароль их отпугивают, а номер телефона и короткий код они вводят каждый день,
  расплачиваясь картой. Поэтому на экране только два поля: номер и ПИН.

  Как это устроено под капотом:
  - Supabase Auth хранит пользователя с "техническим" email, который мы
    детерминированно выводим из номера (наружу он нигде не показывается).
    Это избавляет от SMS-провайдера: регистрация и вход работают сразу,
    бесплатно и без настроек почты.
  - Паролем служит строка, выведенная из ПИНа и номера (см. derivePassword).
  - Регистрация и вход идут через Edge Function `auth-phone-pin`: она создаёт
    подтверждённого пользователя и считает неудачные попытки входа, блокируя
    перебор ПИНа (5 ошибок → пауза 15 минут).

  Честный компромисс для продакшена: следующий шаг — SMS-код как второй фактор.
*/

import { supabase } from "./supabase";

/** Приводит номер к виду +7XXXXXXXXXX. Возвращает null, если это не номер КЗ. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");

  // 8 700 123 45 67 → 7 700 123 45 67 (старый формат с восьмёркой)
  if (digits.length === 11 && digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }
  // 700 123 45 67 → добавляем код страны
  if (digits.length === 10 && digits.startsWith("7")) {
    digits = "7" + digits;
  }
  if (digits.length !== 11 || !digits.startsWith("7")) return null;
  return "+" + digits;
}

/** ПИН — ровно 4 цифры. */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/*
  Технический email и пароль. Формулы должны совпадать с теми, что в
  Edge Function auth-phone-pin — иначе вход не сойдётся.
*/
export function deriveEmail(phoneE164: string): string {
  return `p${phoneE164.slice(1)}@users.sauda-ai.kz`;
}

export function derivePassword(pin: string, phoneE164: string): string {
  return `sauda:${pin}:${phoneE164.slice(1)}`;
}

/* ===== Вызовы Edge Function auth-phone-pin ===== */

type AuthResult =
  | { ok: true }
  | { ok: false; error: string; attemptsLeft?: number; lockedMinutes?: number };

/** Регистрация: создаёт пользователя и сразу входит. */
export async function signUpWithPhonePin(
  name: string,
  phoneE164: string,
  pin: string
): Promise<AuthResult> {
  const { data, error } = await supabase.functions.invoke("auth-phone-pin", {
    body: { action: "signup", name, phone: phoneE164, pin },
  });
  if (error) {
    // Тело ответа с нашим кодом ошибки достаём из context
    const details = await readFunctionError(error);
    return { ok: false, error: details.code ?? "network" };
  }
  return applySession(data);
}

/** Вход: проверяет ПИН через функцию (там же — защита от перебора). */
export async function signInWithPhonePin(
  phoneE164: string,
  pin: string
): Promise<AuthResult> {
  const { data, error } = await supabase.functions.invoke("auth-phone-pin", {
    body: { action: "login", phone: phoneE164, pin },
  });
  if (error) {
    const details = await readFunctionError(error);
    return {
      ok: false,
      error: details.code ?? "network",
      attemptsLeft: details.attempts_left,
      lockedMinutes: details.locked_minutes,
    };
  }
  return applySession(data);
}

/** Функция вернула токены — сохраняем сессию в клиенте Supabase. */
async function applySession(data: {
  access_token?: string;
  refresh_token?: string;
}): Promise<AuthResult> {
  if (!data?.access_token || !data?.refresh_token) {
    return { ok: false, error: "network" };
  }
  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (error) return { ok: false, error: "network" };
  return { ok: true };
}

/** Достаёт JSON с кодом ошибки из FunctionsHttpError. */
async function readFunctionError(err: unknown): Promise<{
  code?: string;
  attempts_left?: number;
  locked_minutes?: number;
}> {
  try {
    const context = (err as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      return await context.json();
    }
  } catch {
    /* тело не прочиталось — вернём общий код */
  }
  return {};
}
