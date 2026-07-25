import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid, LogOut, Sun, Moon, ChevronRight, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang, useTheme } from "../context/AppContext";
import { listPracticeSessions, type PracticeSession } from "../lib/api";
import { averageScore } from "../lib/progress";
import AppHeader from "./AppHeader";

/*
  Profile — личная страница: имя и номер, переключатель темы,
  ссылка на «Мои карточки», прогресс тренировок и выход.
*/
export default function Profile() {
  const { t } = useLang();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const p = t.profile;

  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  const name = (user?.user_metadata?.name as string) ?? "";
  const phone = (user?.user_metadata?.phone as string) ?? "";
  const initial = name.trim().charAt(0).toUpperCase() || "•";

  useEffect(() => {
    listPracticeSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  // Строка в профиле показывает только итог; подробности — на /app/progress
  const average = averageScore(sessions);
  const averageScoreText =
    average === null
      ? t.progress.previewNone
      : t.progress.preview.replace("{score}", String(Math.round(average)));

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 font-medium text-ink/60 transition-colors hover:text-terracotta"
        >
          <ArrowLeft size={18} aria-hidden />
          {t.cards.back}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Шапка профиля */}
          <div className="mt-4 flex items-center gap-4 rounded-3xl bg-surface p-6 shadow-sm">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest font-heading text-2xl font-extrabold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-2xl font-extrabold">{name}</h1>
              <p className="text-ink/50">{phone}</p>
            </div>
          </div>

          {/* Тема */}
          <div className="mt-4 flex items-center justify-between rounded-3xl bg-surface p-6 shadow-sm">
            <span className="font-semibold">{p.themeLabel}</span>
            <div className="flex rounded-xl bg-beige p-1">
              {(
                [
                  { value: "light", label: p.themeLight, icon: Sun },
                  { value: "dark", label: p.themeDark, icon: Moon },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    theme === value ? "bg-surface shadow-sm" : "text-ink/50"
                  }`}
                >
                  <Icon size={16} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Мои карточки */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/app/cards")}
            className="mt-4 flex w-full items-center gap-4 rounded-3xl bg-surface p-6 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
              <LayoutGrid size={24} aria-hidden />
            </span>
            <span className="flex-1 font-heading text-lg font-bold">{p.myCards}</span>
            <ChevronRight size={22} className="text-ink/40" aria-hidden />
          </motion.button>

          {/* Мои тренировки — та же строка-навигация, что и «Мои карточки»:
              подробный разбор живёт на отдельной странице /app/progress */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/app/progress")}
            className="mt-4 flex w-full items-center gap-4 rounded-3xl bg-surface p-6 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-burgundy/10 text-burgundy">
              <Dumbbell size={24} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-lg font-bold">
                {p.progressTitle}
              </span>
              <span className="mt-0.5 block text-ink/50">
                {averageScoreText}
              </span>
            </span>
            <ChevronRight size={22} className="shrink-0 text-ink/40" aria-hidden />
          </motion.button>

          {/* Выход */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-semibold text-terracotta transition-colors hover:bg-terracotta/10"
          >
            <LogOut size={20} aria-hidden />
            {t.app.logout}
          </button>
        </motion.div>
      </main>
    </>
  );
}
