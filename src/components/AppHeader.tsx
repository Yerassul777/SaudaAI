import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang } from "../context/AppContext";
import ThemeToggle from "./ThemeToggle";

/*
  AppHeader — шапка кабинета: логотип, переключатели языка и темы,
  кружок профиля с первой буквой имени. Всё вторичное (карточки, прогресс,
  выход) живёт в профиле — шапка остаётся простой.
*/
export default function AppHeader() {
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const name = (user?.user_metadata?.name as string) ?? "";
  const initial = name.trim().charAt(0).toUpperCase() || "•";

  return (
    <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta text-white">
            <Sparkles size={20} aria-hidden />
          </span>
          <span className="font-heading text-xl font-extrabold">Sauda AI</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Язык */}
          <div className="flex rounded-xl bg-beige p-1">
            {(["kz", "ru"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold uppercase transition-colors ${
                  lang === code ? "bg-surface shadow-sm" : "text-ink/50"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <ThemeToggle />

          {/* Профиль: кружок с инициалом */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate("/app/profile")}
            aria-label={t.profile.title}
            title={t.profile.title}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-forest font-heading text-lg font-extrabold text-white"
          >
            {initial}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
