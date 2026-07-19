import { ArrowRight, ArrowDown, ShoppingBag, Sparkles } from "lucide-react";
import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  BeforeAfter — секция "До и после".
  Слева — блёклая карточка, написанная "самостоятельно",
  справа — красивая mock-карточка, "сделанная" Sauda AI.
  Обе карточки нарисованы div-ами, без настоящих фотографий.
*/

type Props = { t: Content };

export default function BeforeAfter({ t }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <FadeIn>
        <h2 className="text-center font-heading text-3xl font-extrabold md:text-4xl">
          {t.beforeAfter.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-ink/60">
          {t.beforeAfter.subtitle}
        </p>
      </FadeIn>

      <div className="mt-12 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        {/* ===== ДО: серо и уныло ===== */}
        <FadeIn>
          <article className="rounded-3xl border-2 border-dashed border-ink/15 bg-white/60 p-6">
            <span className="inline-block rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink/50">
              {t.beforeAfter.beforeLabel}
            </span>
            <div className="mt-4 flex h-36 items-center justify-center rounded-2xl bg-ink/5">
              <ShoppingBag size={36} className="text-ink/20" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-ink/50">
              {t.beforeAfter.beforeTitle}
            </h3>
            <p className="mt-2 text-sm text-ink/40">{t.beforeAfter.beforeText}</p>
          </article>
        </FadeIn>

        {/* Стрелка между карточками: вправо на десктопе, вниз на телефоне */}
        <FadeIn className="flex justify-center" delay={0.15}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-white shadow-lg shadow-terracotta/25">
            <ArrowRight size={22} className="hidden lg:block" aria-hidden />
            <ArrowDown size={22} className="lg:hidden" aria-hidden />
          </span>
        </FadeIn>

        {/* ===== ПОСЛЕ: тепло и продающе ===== */}
        <FadeIn delay={0.25}>
          <article className="rounded-3xl bg-white p-6 shadow-xl shadow-ink/10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/25 px-3 py-1 text-xs font-semibold text-ink">
              <Sparkles size={14} className="text-terracotta" aria-hidden />
              {t.beforeAfter.afterLabel}
            </span>
            <div className="mt-4 flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-beige to-sun/40">
              <ShoppingBag size={36} className="text-terracotta/50" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold leading-snug">
              {t.beforeAfter.afterTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              {t.beforeAfter.afterText}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.beforeAfter.afterTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-beige px-2.5 py-1 text-xs font-medium text-forest"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-4 flex items-baseline gap-2 rounded-xl bg-forest/10 px-3 py-2">
              <span className="font-heading text-xl font-extrabold text-forest">
                {t.beforeAfter.afterPrice}
              </span>
              <span className="text-xs text-forest/70">{t.beforeAfter.afterPriceNote}</span>
            </p>
          </article>
        </FadeIn>
      </div>
    </section>
  );
}
