import { Check, Copy, ExternalLink, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import type { ExportTarget } from "../lib/exportFormats";
import { marketplaceNames, marketplaceUrls } from "../lib/marketplaceLinks";

/*
  HandoffSheet — панель «текст скопирован, вот что делать дальше».

  Появляется после нажатия на Kaspi / OLX / WB на готовой карточке. Раньше
  кнопка молча клала текст в буфер, и человек оставался с вопросом «а теперь
  куда». Теперь он видит три шага крупным текстом и одну большую кнопку.

  Переход сделан обычной ссылкой <a target="_blank">, а не window.open:
  ссылку не режет блокировщик всплывающих окон, и на телефоне она открывается
  штатно — в том числе в приложении площадки, если оно установлено.
*/
export default function HandoffSheet({
  target,
  onCopyAgain,
  onClose,
}: {
  target: ExportTarget;
  onCopyAgain: () => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const h = t.result.handoff;
  const marketName = marketplaceNames[target];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Затемнение: закрывает панель по нажатию мимо неё */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
        aria-hidden
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={h.stepsTitle}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28 }}
        className="relative w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-2xl sm:m-4 sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={h.close}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-beige hover:text-ink"
        >
          <X size={24} aria-hidden />
        </button>

        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-white">
          <Check size={30} aria-hidden />
        </span>
        <h2 className="mt-4 font-heading text-2xl font-extrabold">{h.copiedTitle}</h2>
        <p className="mt-1 text-ink/60">{h.copiedHint}</p>

        <p className="mt-6 font-heading text-lg font-bold">{h.stepsTitle}</p>
        <ol className="mt-3 flex flex-col gap-3">
          {h.steps[target].map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beige font-heading font-extrabold">
                {i + 1}
              </span>
              <span className="text-lg leading-snug">{step}</span>
            </li>
          ))}
        </ol>

        <motion.a
          href={marketplaceUrls[target]}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-terracotta-dark"
        >
          {h.openBtn.replace("{market}", marketName)}
          <ExternalLink size={20} aria-hidden />
        </motion.a>

        <button
          type="button"
          onClick={onCopyAgain}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 font-semibold text-ink/60 transition-colors hover:bg-beige hover:text-ink"
        >
          <Copy size={18} aria-hidden />
          {h.copyAgain}
        </button>
      </motion.div>
    </div>
  );
}
