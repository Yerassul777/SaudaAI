import { useState } from "react";
import { ArrowLeft, Check, Sparkles, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import type { Content } from "../content";

/*
  RegisterPage — отдельный экран регистрации.

  Как устроена форма:
  1. В состоянии (useState) храним, что ввёл пользователь.
  2. При отправке проверяем каждое поле (это и есть "клиентская валидация").
  3. Если есть ошибки — показываем их под полями.
  4. Если всё хорошо — показываем экран "Спасибо!".

  ВАЖНО: никакой отправки на сервер нет — по заданию это только макет.
*/

type Props = {
  t: Content;
  onBack: () => void; // вернуться на главную страницу
};

/*
  Field — одно поле формы: подпись + input + сообщение об ошибке.
  Вынесено в отдельный компонент, чтобы не повторять одну и ту же разметку
  три раза. Важно: объявляем его СНАРУЖИ RegisterPage — если объявить внутри,
  React будет пересоздавать поле при каждой букве и оно "потеряет фокус".
*/
function Field(props: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-semibold">
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={props.error !== ""}
        className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-forest ${
          props.error ? "border-terracotta" : "border-ink/10"
        }`}
      />
      {/* Сообщение об ошибке (показываем, только если она есть) */}
      {props.error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-terracotta">
          {props.error}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage({ t, onBack }: Props) {
  const r = t.register; // короткое имя, чтобы не писать t.register каждый раз

  // Значения полей формы
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");

  // Тексты ошибок для каждого поля ("" — ошибки нет)
  const [errors, setErrors] = useState({ name: "", contact: "", password: "" });

  // Успешно ли отправлена форма
  const [submitted, setSubmitted] = useState(false);

  // Проверка "это похоже на email?" — есть символы, @, точка в домене
  function isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Проверка "это похоже на телефон?" — цифры, можно +, пробелы, скобки, дефисы
  function isPhone(value: string): boolean {
    const digits = value.replace(/\D/g, ""); // оставляем только цифры
    return /^[+\d][\d\s()-]+$/.test(value) && digits.length >= 10;
  }

  // Главная функция проверки. Возвращает true, если всё заполнено верно.
  function validate(): boolean {
    const newErrors = { name: "", contact: "", password: "" };

    if (name.trim() === "") {
      newErrors.name = r.errorRequired;
    }

    if (contact.trim() === "") {
      newErrors.contact = r.errorRequired;
    } else if (!isEmail(contact.trim()) && !isPhone(contact.trim())) {
      newErrors.contact = r.errorContact;
    }

    if (password === "") {
      newErrors.password = r.errorRequired;
    } else if (password.length < 6) {
      newErrors.password = r.errorPassword;
    }

    setErrors(newErrors);
    // Форма верна, если все три ошибки — пустые строки
    return newErrors.name === "" && newErrors.contact === "" && newErrors.password === "";
  }

  // Обработчик отправки формы
  function handleSubmit(event: React.FormEvent) {
    // Отменяем стандартную перезагрузку страницы браузером
    event.preventDefault();
    if (validate()) {
      setSubmitted(true); // показываем экран "Спасибо!"
    }
  }

  // ===== Экран успеха после отправки =====
  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl shadow-ink/10"
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sun/25 text-terracotta">
            <PartyPopper size={30} aria-hidden />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-extrabold">{r.successTitle}</h1>
          <p className="mt-3 leading-relaxed text-ink/60">{r.successText}</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-7 rounded-xl bg-terracotta px-6 py-3 font-semibold text-white transition-colors hover:bg-terracotta-dark"
          >
            {r.backToHome}
          </button>
        </motion.div>
      </main>
    );
  }

  // ===== Экран с формой =====
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Левая колонка: преимущества (видна только на десктопе) */}
      <aside className="hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="flex items-center gap-2">
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

      {/* Правая колонка: сама форма */}
      <div className="flex min-h-screen flex-col px-4 py-6 sm:px-10 lg:min-h-0 lg:justify-center">
        {/* Кнопка "назад" */}
        <button
          type="button"
          onClick={onBack}
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

          {/* noValidate — отключаем встроенную проверку браузера,
              потому что пишем свою, с понятными сообщениями */}
          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
            <Field
              id="name"
              label={r.nameLabel}
              type="text"
              placeholder={r.namePlaceholder}
              value={name}
              error={errors.name}
              onChange={setName}
            />
            <Field
              id="contact"
              label={r.contactLabel}
              type="text"
              placeholder={r.contactPlaceholder}
              value={contact}
              error={errors.contact}
              onChange={setContact}
            />
            <Field
              id="password"
              label={r.passwordLabel}
              type="password"
              placeholder={r.passwordPlaceholder}
              value={password}
              error={errors.password}
              onChange={setPassword}
            />

            <button
              type="submit"
              className="mt-2 rounded-xl bg-terracotta px-6 py-3.5 font-semibold text-white shadow-lg shadow-terracotta/25 transition-all hover:-translate-y-0.5 hover:bg-terracotta-dark"
            >
              {r.submit}
            </button>
          </form>

          {/* Ссылка-заглушка "Войти" — по заданию никуда не ведёт */}
          <p className="mt-6 text-center text-sm text-ink/60">
            {r.haveAccount}{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
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
