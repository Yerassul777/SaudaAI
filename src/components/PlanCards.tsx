import { useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import type { Content } from "../content";

/*
  PlanCards — две карточки тарифов. Один и тот же блок стоит на лендинге и на
  экране «Тарифы» внутри приложения, поэтому тексты приходят снаружи через t.

  Кнопка «Подключить Про» никуда не ведёт и ничего не оплачивает: она открывает
  панель, которая прямо говорит, что подписки пока нет.

  Полей для ввода карты здесь нет и не будет. Собирать номер карты без
  сертификации PCI DSS нельзя, а «ненастоящая» форма опасна ровно так же:
  человек введёт в неё настоящую карту.
*/

type Props = {
  t: Content;
  /** Показывать на бесплатном плане пометку «ваш план». Только внутри приложения. */
  showCurrent?: boolean;
};

export default function PlanCards({ t, showCurrent = false }: Props) {
  const p = t.pricing;
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        {/* ===== Бесплатно ===== */}
        <section className="flex flex-col rounded-3xl border-2 border-line bg-surface p-7 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-2xl font-extrabold">{p.free.name}</h3>
            {showCurrent && (
              <span className="rounded-full bg-forest/12 px-3 py-1 text-sm font-bold text-forest">
                {p.currentBadge}
              </span>
            )}
          </div>
          <p className="mt-3 font-heading text-4xl font-extrabold">{p.free.price}</p>

          <ul className="mt-6 flex flex-1 flex-col gap-3">
            {p.free.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest/12 text-forest">
                  <Check size={15} aria-hidden />
                </span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== Про ===== */}
        <section className="flex flex-col rounded-3xl bg-forest p-7 text-white shadow-lg">
          <h3 className="font-heading text-2xl font-extrabold">{p.pro.name}</h3>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-4xl font-extrabold">{p.pro.price}</span>
            <span className="font-semibold text-white/70">{p.pro.period}</span>
          </p>

          <ul className="mt-6 flex flex-1 flex-col gap-3">
            {p.pro.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check size={15} aria-hidden />
                </span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setSheetOpen(true)}
            className="mt-7 w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-forest transition-colors hover:bg-white/90"
          >
            {p.pro.cta}
          </motion.button>
        </section>
      </div>

      {/* ===== Панель «подписки ещё нет» ===== */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/50"
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={p.sheetTitle}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.28 }}
            className="relative w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-2xl sm:m-4 sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label={p.close}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-beige hover:text-ink"
            >
              <X size={24} aria-hidden />
            </button>

            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sun/25 text-terracotta">
              <Clock size={30} aria-hidden />
            </span>
            <h2 className="mt-4 pr-12 font-heading text-2xl font-extrabold">
              {p.sheetTitle}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-ink/70">{p.sheetText}</p>
            <p className="mt-3 text-ink/50">{p.sheetNote}</p>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSheetOpen(false)}
              className="mt-7 w-full rounded-2xl bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-terracotta-dark"
            >
              {p.sheetOk}
            </motion.button>
          </motion.div>
        </div>
      )}
    </>
  );
}
