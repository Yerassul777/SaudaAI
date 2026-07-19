/*
  auth-phone-pin — вход и регистрация по номеру телефона и 4-значному ПИНу.

  Зачем отдельная функция, а не прямой вызов Supabase Auth из браузера:
  1. Создаём пользователя сразу подтверждённым (admin API) — не нужны ни
     SMS-провайдер, ни почтовые письма. Для аудитории сервиса (мастера и
     фермеры, многим за 50) это убирает главный барьер входа.
  2. Считаем неудачные попытки входа на сервере и блокируем перебор ПИНа:
     после MAX_ATTEMPTS ошибок номер замораживается на LOCK_MINUTES минут.
     Клиентскую проверку обойти легко, серверную — нет.

  Под капотом у пользователя технический email, детерминированно выведенный
  из номера. Формулы deriveEmail/derivePassword обязаны совпадать с
  src/lib/auth.ts на клиенте.

  План для продакшена: SMS-код как второй фактор при входе с нового устройства.
*/
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function deriveEmail(phoneE164: string): string {
  return `p${phoneE164.slice(1)}@users.sauda-ai.kz`;
}

function derivePassword(pin: string, phoneE164: string): string {
  return `sauda:${pin}:${phoneE164.slice(1)}`;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: { action?: string; phone?: string; pin?: string; name?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ code: "bad_request" }, 400);
  }

  const { action, phone, pin, name } = payload;

  // Валидация входа: номер строго +7XXXXXXXXXX, ПИН строго 4 цифры
  if (!phone || !/^\+7\d{10}$/.test(phone)) {
    return jsonResponse({ code: "bad_phone" }, 400);
  }
  if (!pin || !/^\d{4}$/.test(pin)) {
    return jsonResponse({ code: "bad_pin" }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // admin — для создания пользователей и таблицы попыток (обходит RLS);
  // authClient — обычный клиент, которым проверяем пару логин/пароль.
  const admin = createClient(url, serviceKey);
  const authClient = createClient(url, anonKey);

  const email = deriveEmail(phone);
  const password = derivePassword(pin, phone);

  /* ===== Регистрация ===== */
  if (action === "signup") {
    if (!name || name.trim() === "") {
      return jsonResponse({ code: "bad_name" }, 400);
    }

    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // сразу подтверждён: писем и SMS не шлём
      user_metadata: { name: name.trim(), phone },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("already") || message.includes("registered")) {
        return jsonResponse({ code: "exists" }, 409);
      }
      console.error("signup error:", error.message);
      return jsonResponse({ code: "server" }, 500);
    }

    // Сразу входим, чтобы клиент получил сессию одним запросом
    const { data, error: signInError } =
      await authClient.auth.signInWithPassword({ email, password });
    if (signInError || !data.session) {
      console.error("post-signup signin error:", signInError?.message);
      return jsonResponse({ code: "server" }, 500);
    }

    return jsonResponse(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      200
    );
  }

  /* ===== Вход ===== */
  if (action === "login") {
    // Номер заблокирован после серии неверных ПИНов?
    const { data: row } = await admin
      .from("login_attempts")
      .select("attempts, locked_until")
      .eq("phone", phone)
      .maybeSingle();

    if (row?.locked_until && new Date(row.locked_until) > new Date()) {
      const minutesLeft = Math.max(
        1,
        Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 60000)
      );
      return jsonResponse({ code: "locked", locked_minutes: minutesLeft }, 429);
    }

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      // Неверный ПИН (или номера нет): считаем попытку
      const attempts = (row?.attempts ?? 0) + 1;
      const isLocked = attempts >= MAX_ATTEMPTS;
      await admin.from("login_attempts").upsert({
        phone,
        attempts: isLocked ? 0 : attempts,
        locked_until: isLocked
          ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      });

      if (isLocked) {
        return jsonResponse(
          { code: "locked", locked_minutes: LOCK_MINUTES },
          429
        );
      }
      return jsonResponse(
        { code: "wrong", attempts_left: MAX_ATTEMPTS - attempts },
        401
      );
    }

    // Успешный вход — сбрасываем счётчик
    await admin.from("login_attempts").delete().eq("phone", phone);

    return jsonResponse(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      200
    );
  }

  return jsonResponse({ code: "bad_action" }, 400);
});
