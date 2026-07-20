import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid, LogOut, Sun, Moon, ChevronRight, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang, useTheme } from "../context/AppContext";
import { listPracticeSessions, type PracticeSession } from "../lib/api";
import AppHeader from "./AppHeader";

/*
  Profile — личная страница: имя и номер, переключатель темы,
  ссылка на «Мои карточки», прогресс тренировок и выход.
*/
export default function Profile() {
  const { t, lang } = useLang();
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

          {/* Прогресс тренировок */}
          <section className="mt-4 rounded-3xl bg-surface p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
              <Dumbbell size={20} className="text-burgundy" aria-hidden />
              {p.progressTitle}
            </h2>
            {sessions.length === 0 ? (
              <p className="mt-3 text-ink/50">{p.progressEmpty}</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {sessions.map((session) => (
                  <li key={session.id} className="rounded-2xl bg-beige p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold capitalize">{session.marketplace}</span>
                      <span className="rounded-full bg-forest px-3 py-1 font-heading text-sm font-extrabold text-white">
                        {session.score}/10
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">
                      {session.feedback}
                    </p>
                    <p className="mt-1 text-xs text-ink/40">
                      {new Date(session.created_at).toLocaleDateString(
                        lang === "kz" ? "kk-KZ" : "ru-RU"
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

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
