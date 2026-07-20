import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { normalizePhone, isValidPin, signUpWithPhonePin } from "../lib/auth";
import Field from "./Field";
import PinInput from "./PinInput";
import { OrnamentDivider } from "./Ornament";

/*
  RegisterPage — регистрация: имя, номер, ПИН из 4 ячеек.
  Форма по центру экрана на лёгком орнамент-фоне. Под полем номера — блок
  доверия: аудитория боится оставлять номер, объясняем простыми словами,
  что это просто логин.
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
    setServerError(result.error === "exists" ? r.errorExists : r.errorNetwork);
  }

  return (
    <main className="ornament-bg flex min-h-screen flex-col px-4 py-6">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="inline-flex w-fit items-center gap-2 rounded-lg py-2 pr-3 font-medium text-ink/60 transition-colors hover:text-terracotta"
      >
        <ArrowLeft size={18} aria-hidden />
        {r.backToHome}
      </button>

      <div className="flex flex-1 items-center justify-center py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-3xl bg-surface p-7 shadow-xl shadow-ink/10 sm:p-9"
        >
          {/* Логотип + орнамент */}
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta text-white">
              <Sparkles size={22} aria-hidden />
            </span>
            <span className="font-heading text-2xl font-extrabold">Sauda AI</span>
          </div>
          <OrnamentDivider className="mt-4 text-terracotta" />

          <h1 className="mt-5 text-center font-heading text-3xl font-extrabold">
            {r.title}
          </h1>
          <p className="mt-2 text-center text-ink/60">{r.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
            <Field
              id="name"
              label={r.nameLabel}
              placeholder={r.namePlaceholder}
              value={name}
              error={errors.name}
              onChange={setName}
            />
            <div>
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
              {/* Блок доверия: почему оставить номер — безопасно */}
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-forest/10 p-3.5">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-forest" aria-hidden />
                <p className="text-sm leading-relaxed text-ink/70">
                  <span className="font-semibold text-forest">{r.trustTitle}</span>{" "}
                  {r.trustText}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="pin">
                {r.pinLabel}
              </label>
              <PinInput id="pin" value={pin} onChange={setPin} error={Boolean(errors.pin)} />
              {errors.pin ? (
                <p role="alert" className="mt-2 text-center text-sm font-medium text-terracotta">
                  {errors.pin}
                </p>
              ) : (
                <p className="mt-2 text-center text-sm text-ink/50">{r.pinHint}</p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
                {serverError}
              </p>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={sending}
              className="btn-pulse mt-1 rounded-2xl bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-lg shadow-terracotta/25 transition-colors hover:bg-terracotta-dark disabled:cursor-wait disabled:opacity-60"
            >
              {sending ? "…" : r.submit}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-ink/60">
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
