import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { normalizePhone, isValidPin, signUpWithPhonePin } from "../lib/auth";
import Field from "./Field";

/*
  RegisterPage — настоящая регистрация: имя, номер телефона и 4-значный ПИН.

  Почему ПИН, а не пароль: аудитория сервиса каждый день вводит ПИН банковской
  карты, а пароли забывает. Ошиблись 5 раз — сервер заблокирует номер на
  15 минут (см. Edge Function auth-phone-pin), поэтому короткий код безопасен
  настолько, насколько нужно для MVP.

  После успешной регистрации функция сразу возвращает сессию,
  и мы попадаем на дашборд без лишних шагов.
*/
export default function RegisterPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const r = t.register;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState({ name: "", phone: "", pin: "" });
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);

  function validate(): string | null {
    const next = { name: "", phone: "", pin: "" };
    if (name.trim() === "") next.name = r.errorRequired;

    const normalized = normalizePhone(phone);
    if (phone.trim() === "") next.phone = r.errorRequired;
    else if (!normalized) next.phone = r.errorPhone;

    if (pin === "") next.pin = r.errorRequired;
    else if (!isValidPin(pin)) next.pin = r.errorPin;

    setErrors(next);
    if (next.name || next.phone || next.pin) return null;
    return normalized;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError("");
    const normalized = validate();
    if (!normalized || sending) return;

    setSending(true);
    const result = await signUpWithPhonePin(name, normalized, pin);
    setSending(false);

    if (result.ok) {
      navigate("/app");
      return;
    }
    // Код ошибки от функции переводим в понятный текст
    setServerError(result.error === "exists" ? r.errorExists : r.errorNetwork);
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Левая колонка: преимущества (видна только на десктопе) */}
      <aside className="hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta text-white">
            <Sparkles size={20} aria-hidden />
          </span>
          <span className="font-heading text-2xl font-extrabold">Sauda AI</span>
        </a>

        <h2 className="mt-10 max-w-md font-heading text-3xl font-extrabold leading-snug">
          {t.hero.title}
        </h2>

        <p className="mt-6 font-semibold text-white/80">{r.benefitsTitle}</p>
        <ul className="mt-4 flex flex-col gap-3">
          {r.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sun text-ink">
                <Check size={14} aria-hidden />
              </span>
              <span className="text-white/85">{benefit}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Правая колонка: форма */}
      <div className="flex min-h-screen flex-col px-4 py-6 sm:px-10 lg:min-h-0 lg:justify-center">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex w-fit items-center gap-2 rounded-lg py-2 pr-3 text-sm font-medium text-ink/60 transition-colors hover:text-terracotta"
        >
          <ArrowLeft size={18} aria-hidden />
          {r.backToHome}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-6 w-full max-w-md lg:mt-0"
        >
          <h1 className="font-heading text-3xl font-extrabold">{r.title}</h1>
          <p className="mt-2 text-ink/60">{r.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
            <Field
              id="name"
              label={r.nameLabel}
              placeholder={r.namePlaceholder}
              value={name}
              error={errors.name}
              onChange={setName}
            />
            <Field
              id="phone"
              label={r.phoneLabel}
              type="tel"
              inputMode="tel"
              placeholder={r.phonePlaceholder}
              value={phone}
              error={errors.phone}
              onChange={setPhone}
            />
            <Field
              id="pin"
              label={r.pinLabel}
              type="password"
              inputMode="numeric"
              maxLength={4}
              big
              placeholder={r.pinPlaceholder}
              value={pin}
              error={errors.pin}
              hint={r.pinHint}
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
              {sending ? "…" : r.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            {r.haveAccount}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
              className="font-semibold text-forest underline-offset-2 hover:underline"
            >
              {r.login}
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
