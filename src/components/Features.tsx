import { Heading1, ScrollText, Tags, CircleDollarSign, Languages } from "lucide-react";
import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  Features — секция "Что умеет Sauda AI".
  Сетка из 4 возможностей + бейдж "на казахском и русском".
  id="features" — для прокрутки из меню.
*/

type Props = { t: Content };

const icons = [Heading1, ScrollText, Tags, CircleDollarSign];

export default function Features({ t }: Props) {
  return (
    <section id="features" className="bg-forest scroll-mt-20 py-16 text-white md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn className="flex flex-col items-center">
          <h2 className="text-center font-heading text-3xl font-extrabold md:text-4xl">
            {t.features.title}
          </h2>
          {/* Бейдж про два языка */}
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-sun px-4 py-1.5 text-sm font-semibold text-ink">
            <Languages size={16} aria-hidden />
            {t.features.badge}
          </span>
        </FadeIn>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <FadeIn key={item.title} delay={i * 0.1}>
                <article className="h-full rounded-3xl bg-white/10 p-6 backdrop-blur transition-colors hover:bg-white/15">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sun text-ink">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{item.text}</p>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
