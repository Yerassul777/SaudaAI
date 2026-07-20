import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang } from "../context/AppContext";
import { listCards, type CardRow } from "../lib/api";
import AppHeader from "./AppHeader";

/*
  Dashboard — первый экран после входа.
  Одна большая кнопка «Создать карточку» и последние сохранённые карточки.
  Никаких вкладок: весь путь пользователя — это одна кнопка.
*/
export default function Dashboard() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardRow[]>([]);

  const name = (user?.user_metadata?.name as string) ?? "";

  useEffect(() => {
    listCards()
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
            {t.app.greeting} {name}!
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ink/60">{t.app.lead}</p>

          {/* Главная кнопка — крупная, одна */}
          <button
            type="button"
            onClick={() => navigate("/app/new")}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-terracotta px-8 py-6 font-heading text-xl font-extrabold text-white shadow-xl shadow-terracotta/25 transition-all hover:-translate-y-0.5 hover:bg-terracotta-dark sm:w-auto sm:px-14"
          >
            <Camera size={26} aria-hidden />
            {t.app.createBtn}
          </button>
        </motion.div>

        {/* Последние карточки */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-extrabold">
              {t.app.recentTitle}
            </h2>
            {cards.length > 0 && (
              <button
                type="button"
                onClick={() => navigate("/app/cards")}
                className="flex items-center gap-1 text-sm font-semibold text-forest hover:underline"
              >
                {t.app.open}
                <ChevronRight size={16} aria-hidden />
              </button>
            )}
          </div>

          {cards.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-beige px-6 py-8 text-center text-ink/50">
              {t.app.empty}
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {cards.slice(0, 4).map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => navigate("/app/cards")}
                    className="w-full rounded-2xl bg-surface p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="font-heading font-bold leading-snug">
                      {lang === "kz" ? card.title_kz : card.title_ru}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-forest">
                      {card.price_recommended?.toLocaleString("ru-RU")} ₸
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
