import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Content, Lang } from "../content";
import ThemeToggle from "./ThemeToggle";

/*
  Navbar — "липкая" шапка сайта.
  Она всегда остаётся сверху при прокрутке (класс sticky).
  Внутри: логотип, меню-якоря по секциям, переключатель языка KZ/RU
  и главная кнопка "Начать бесплатно".
*/

type Props = {
  t: Content; // тексты текущего языка
  lang: Lang; // какой язык выбран сейчас
  onLangChange: (lang: Lang) => void; // сменить язык
  onRegister: () => void; // перейти на экран регистрации
};

export default function Navbar({ t, lang, onLangChange, onRegister }: Props) {
  // Открыто ли мобильное меню (на телефонах меню прячется за "бургер")
  const [menuOpen, setMenuOpen] = useState(false);

  // Пункты меню: подпись + id секции, к которой прокручиваем
  const links = [
    { label: t.nav.howItWorks, href: "#how" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.audience, href: "#audience" },
    { label: t.nav.faq, href: "#faq" },
  ];

  // Кнопка-переключатель одного языка (RU или KZ)
  function LangButton({ code }: { code: Lang }) {
    const isActive = lang === code;
    return (
      <button
        type="button"
        onClick={() => onLangChange(code)}
        className={`rounded-lg px-2.5 py-1 text-sm font-semibold transition-colors ${
          isActive
            ? "bg-forest text-white"
            : "text-ink/60 hover:text-ink"
        }`}
      >
        {code.toUpperCase()}
      </button>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Логотип */}
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta text-white">
            <Sparkles size={18} aria-hidden />
          </span>
          <span className="font-heading text-xl font-extrabold">Sauda AI</span>
        </a>

        {/* Меню для планшета и десктопа (на телефоне скрыто) */}
        <ul className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-ink/70 transition-colors hover:text-terracotta"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Правая часть: язык + тема + кнопка + бургер */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-beige p-1">
            <LangButton code="kz" />
            <LangButton code="ru" />
          </div>

          <ThemeToggle className="hidden sm:flex" />

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onRegister}
            className="hidden rounded-xl bg-terracotta px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-terracotta/25 transition-colors hover:bg-terracotta-dark sm:block"
          >
            {t.nav.cta}
          </motion.button>

          {/* Кнопка-бургер: видна только на телефоне */}
          <button
            type="button"
            className="rounded-lg p-2 text-ink md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Выпадающее мобильное меню */}
      {menuOpen && (
        <div className="border-t border-ink/5 bg-cream px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-1 pt-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 font-medium text-ink/80 hover:bg-beige"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onRegister();
              }}
              className="flex-1 rounded-xl bg-terracotta px-4 py-3 font-semibold text-white"
            >
              {t.nav.cta}
            </button>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
