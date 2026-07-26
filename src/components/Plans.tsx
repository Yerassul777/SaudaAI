import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import AppHeader from "./AppHeader";
import PlanCards from "./PlanCards";

/*
  Plans — экран «Тарифы» внутри приложения, открывается из профиля.

  Показывает те же две карточки, что и лендинг, но с пометкой «ваш план»
  на бесплатном: человек уже вошёл, и ему важно понимать, где он сейчас.
*/
export default function Plans() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/app/profile")}
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
          <h1 className="mt-4 font-heading text-3xl font-extrabold">
            {t.pricing.title}
          </h1>
          <p className="mt-2 text-lg text-ink/60">{t.pricing.subtitle}</p>

          <div className="mt-8">
            <PlanCards t={t} showCurrent />
          </div>
        </motion.div>
      </main>
    </>
  );
}
