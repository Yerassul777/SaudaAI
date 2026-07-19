import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { normalizePhone, isValidPin, signInWithPhonePin } from "../lib/auth";
import Field from "./Field";

/*
  LoginPage — вход: номер телефона + ПИН. Два поля, одна кнопка.

  Сервер (Edge Function auth-phone-pin) считает неудачные попытки:
  после пятой блокирует номер на 15 минут. Здесь мы показываем
  и остаток попыток, и время блокировки.
*/
export default function LoginPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const l = t.login;
  const r = t.register; // общие тексты ошибок валидации

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState({ phone: "", pin: "" });
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError("");

    const next = { phone: "", pin: "" };
    const normalized = normalizePhone(phone);
    if (phone.trim() === "") next.phone = r.errorRequired;
    else if (!normalized) next.phone = r.errorPhone;
    if (pin === "") next.pin = r.errorRequired;
    else if (!isValidPin(pin)) next.pin = r.errorPin;
    setErrors(next);
    if (next.phone || next.pin || !normalized || sending) return;

    setSending(true);
    const result = await signInWithPhonePin(normalized, pin);
    setSending(false);

    if (result.ok) {
      navigate("/app");
      return;
    }

    if (result.error === "locked") {
      setServerError(`${l.errorLocked} ${result.lockedMinutes ?? 15} ${l.errorLockedUnit}`);
    } else if (result.error === "wrong") {
      const left =
        result.attemptsLeft !== undefined
          ? ` ${l.errorAttemptsLeft} ${result.attemptsLeft}`
          : "";
      setServerError(l.errorWrongPin + left);
    } else {
      setServerError(r.errorNetwork);
    }
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 sm:px-10">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="inline-flex w-fit items-center gap-2 rounded-lg py-2 pr-3 text-sm font-medium text-ink/60 transition-colors hover:text-terracotta"
      >
        <ArrowLeft size={18} aria-hidden />
        {r.backToHome}
      </button>

      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-ink/5 sm:p-10"
        >
          <h1 className="font-heading text-3xl font-extrabold">{l.title}</h1>
          <p className="mt-2 text-ink/60">{l.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
            <Field
              id="phone"
              label={l.phoneLabel}
              type="tel"
              inputMode="tel"
              placeholder={l.phonePlaceholder}
              value={phone}
              error={errors.phone}
              onChange={setPhone}
            />
            <Field
              id="pin"
              label={l.pinLabel}
              type="password"
              inputMode="numeric"
              maxLength={4}
              big
              placeholder={l.pinPlaceholder}
              value={pin}
              error={errors.pin}
              onChange={(v) => setPin(v.replace(/\D/g, ""))}
            />

            {serverError && (
              <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-2 rounded-xl bg-terracotta px-6 py-3.5 font-semibold text-white shadow-lg shadow-terracotta/25 transition-all hover:-translate-y-0.5 hover:bg-terracotta-dark disabled:cursor-wait disabled:opacity-60"
            >
              {sending ? "…" : l.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            {l.noAccount}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
              className="font-semibold text-forest underline-offset-2 hover:underline"
            >
              {l.registerLink}
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
