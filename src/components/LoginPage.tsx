import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { normalizePhone, isValidPin, signInWithPhonePin } from "../lib/auth";
import Field from "./Field";
import PinInput from "./PinInput";
import { OrnamentDivider } from "./Ornament";

/*
  LoginPage — вход: номер + ПИН из 4 ячеек, форма по центру.
  В ошибку «не подходит» встроена ссылка на регистрацию: частый случай —
  человек опечатался в номере или ещё не создавал аккаунт.
*/
export default function LoginPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const l = t.login;
  const r = t.register;

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState({ phone: "", pin: "" });
  const [serverError, setServerError] = useState("");
  const [showRegisterHint, setShowRegisterHint] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError("");
    setShowRegisterHint(false);

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
      setShowRegisterHint(true);
    } else {
      setServerError(r.errorNetwork);
    }
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
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta text-white">
              <Sparkles size={22} aria-hidden />
            </span>
            <span className="font-heading text-2xl font-extrabold">Sauda AI</span>
          </div>
          <OrnamentDivider className="mt-4 text-terracotta" />

          <h1 className="mt-5 text-center font-heading text-3xl font-extrabold">
            {l.title}
          </h1>
          <p className="mt-2 text-center text-ink/60">{l.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
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

            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="pin">
                {l.pinLabel}
              </label>
              <PinInput id="pin" value={pin} onChange={setPin} error={Boolean(errors.pin)} />
              {errors.pin && (
                <p role="alert" className="mt-2 text-center text-sm font-medium text-terracotta">
                  {errors.pin}
                </p>
              )}
            </div>

            {serverError && (
              <div role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
                {serverError}
                {showRegisterHint && (
                  <>
                    {" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/register");
                      }}
                      className="font-semibold underline underline-offset-2"
                    >
                      {l.registerLink}
                    </a>
                  </>
                )}
              </div>
            )}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={sending}
              className="mt-1 rounded-2xl bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-lg shadow-terracotta/25 transition-colors hover:bg-terracotta-dark disabled:cursor-wait disabled:opacity-60"
            >
              {sending ? "…" : l.submit}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-ink/60">
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
