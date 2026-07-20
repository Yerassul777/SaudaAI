import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { markets } from "../data/practice";
import AppHeader from "./AppHeader";

/*
  Practice — выбор площадки для тренировки: три огромные карточки
  в узнаваемых цветах (без логотипов — только названия).
*/
export default function Practice() {
  const { t } = useLang();
  const navigate = useNavigate();
  const p = t.practice;

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
          <h1 className="mt-4 font-heading text-3xl font-extrabold">{p.title}</h1>
          <p className="mt-2 text-lg text-ink/60">{p.subtitle}</p>

          <div className="mt-8 flex flex-col gap-4">
            {markets.map((market, i) => (
              <motion.button
                key={market.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/app/practice/${market.id}`)}
                className={`flex w-full items-center gap-5 rounded-3xl px-6 py-7 text-left shadow-lg ${market.accentBg} ${market.accentText}`}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Store size={28} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-2xl font-extrabold">
                    {market.name}
                  </span>
                  <span className="mt-0.5 block text-sm opacity-80">
                    {p.marketTagline[market.id]}
                  </span>
                </span>
                <ChevronRight size={24} className="shrink-0 opacity-70" aria-hidden />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
    </>
  );
}
