import { Camera, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Content } from "../content";

/*
  Hero — самый первый, главный экран сайта.
  Слева: большой заголовок, подзаголовок, две кнопки и метрики доверия.
  Справа: "мокап" — карточка товара, нарисованная обычными div-ами
  и Tailwind-классами (без единой картинки, как требует задание).
*/

type Props = {
  t: Content;
  onRegister: () => void; // клик по "Начать бесплатно" ведёт на регистрацию
};

export default function Hero({ t, onRegister }: Props) {
  return (
    <section id="top" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
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

          {/* Две кнопки: главная (терракота) и вторичная (обводка) */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRegister}
              className="rounded-xl bg-terracotta px-7 py-3.5 text-center font-semibold text-white shadow-lg shadow-terracotta/25 transition-all hover:-translate-y-0.5 hover:bg-terracotta-dark"
            >
              {t.hero.primaryBtn}
            </button>
            <a
              href="#how"
              className="rounded-xl border-2 border-forest px-7 py-3.5 text-center font-semibold text-forest transition-colors hover:bg-forest hover:text-white"
            >
              {t.hero.secondaryBtn}
            </a>
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

        {/* ===== Правая колонка: мокап карточки товара ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm"
        >
          {/* Декоративное пятно за карточкой */}
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[32px] bg-terracotta/10 rotate-3"
          />

          <div className="relative rounded-3xl bg-white p-5 shadow-xl shadow-ink/10">
            {/* "Фото" товара — рисуем градиентом и иконкой, без картинок */}
            <div className="flex h-52 items-center justify-center rounded-2xl bg-gradient-to-br from-beige to-sun/40">
              <Camera size={48} className="text-ink/30" aria-hidden />
            </div>

            {/* Бейдж "Готово за 10 сек" */}
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1 text-xs font-semibold text-ink">
              <Sparkles size={14} className="text-terracotta" aria-hidden />
              {t.hero.mockBadge}
            </span>

            <h3 className="mt-3 font-heading text-lg font-bold leading-snug">
              {t.hero.mockTitle}
            </h3>
            <p className="mt-1.5 text-sm text-ink/60">{t.hero.mockDesc}</p>

            {/* Теги */}
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
