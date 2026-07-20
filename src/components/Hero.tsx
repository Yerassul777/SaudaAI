import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Content } from "../content";
import { OrnamentDivider } from "./Ornament";

/*
  Hero — первый экран. Слева заголовок и пульсирующая CTA, справа — карточка
  товара с настоящим фото (сгенерировано нашей же функцией «студийное фото»).
*/

type Props = {
  t: Content;
  onRegister: () => void;
};

export default function Hero({ t, onRegister }: Props) {
  return (
    <section id="top" className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-16">
      {/* Орнаментная лента под шапкой */}
      <OrnamentDivider className="mb-10 text-terracotta md:mb-14" />

      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* ===== Левая колонка: текст ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {t.hero.title}
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
            {t.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onRegister}
              className="btn-pulse rounded-2xl bg-terracotta px-8 py-4 text-center text-lg font-bold text-white shadow-lg shadow-terracotta/25 transition-colors hover:bg-terracotta-dark"
            >
              {t.hero.primaryBtn}
            </motion.button>
            <motion.a
              whileTap={{ scale: 0.96 }}
              href="#how"
              className="rounded-2xl border-2 border-forest px-8 py-4 text-center text-lg font-semibold text-forest transition-colors hover:bg-forest hover:text-white"
            >
              {t.hero.secondaryBtn}
            </motion.a>
          </div>

          {/* Метрики доверия */}
          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="sr-only">{t.hero.metric1Label}</dt>
              <dd className="font-heading text-3xl font-extrabold text-forest">
                {t.hero.metric1Value}
              </dd>
              <p className="mt-1 max-w-45 text-sm text-ink/60">{t.hero.metric1Label}</p>
            </div>
            <div>
              <dt className="sr-only">{t.hero.metric2Label}</dt>
              <dd className="font-heading text-3xl font-extrabold text-forest">
                {t.hero.metric2Value}
              </dd>
              <p className="mt-1 max-w-45 text-sm text-ink/60">{t.hero.metric2Label}</p>
            </div>
          </dl>
        </motion.div>

        {/* ===== Правая колонка: карточка с живым фото ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div
            aria-hidden
            className="absolute -inset-6 rotate-3 rounded-[32px] bg-terracotta/10"
          />

          <div className="relative rounded-3xl bg-surface p-5 shadow-xl shadow-ink/10">
            {/* Настоящее фото — сделано нашей же функцией «студийное фото» */}
            <img
              src="/demo/honey.jpg"
              alt=""
              width={640}
              height={640}
              className="h-56 w-full rounded-2xl object-cover"
            />

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1 text-xs font-semibold text-ink">
              <Sparkles size={14} className="text-terracotta" aria-hidden />
              {t.hero.mockBadge}
            </span>

            <h3 className="mt-3 font-heading text-lg font-bold leading-snug">
              {t.hero.mockTitle}
            </h3>
            <p className="mt-1.5 text-sm text-ink/60">{t.hero.mockDesc}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.hero.mockTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-beige px-2.5 py-1 text-xs font-medium text-forest"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-4 rounded-xl bg-forest/10 px-3 py-2 text-sm font-semibold text-forest">
              {t.hero.mockPrice}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
