import { Palette, Wheat, House } from "lucide-react";
import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  Audience — секция "Для кого": три персоны-портрета.
  Вместо фотографий — цветные круги-плейсхолдеры с иконками.
  id="audience" — для прокрутки из меню.
*/

type Props = { t: Content };

// Иконка и цвет "аватарки" для каждой персоны
const personaStyle = [
  { icon: Palette, bg: "bg-terracotta/15", color: "text-terracotta" },
  { icon: Wheat, bg: "bg-sun/25", color: "text-ink" },
  { icon: House, bg: "bg-forest/15", color: "text-forest" },
];

export default function Audience({ t }: Props) {
  return (
    <section id="audience" className="bg-beige/60 scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-center font-heading text-3xl font-extrabold md:text-4xl">
            {t.audience.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-ink/60">
            {t.audience.subtitle}
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.audience.personas.map((persona, i) => {
            const { icon: Icon, bg, color } = personaStyle[i];
            return (
              <FadeIn key={persona.title} delay={i * 0.12}>
                <article className="h-full rounded-3xl bg-surface p-7 text-center shadow-sm shadow-ink/5 transition-shadow hover:shadow-md">
                  {/* Круг-аватар вместо фото */}
                  <span
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${bg} ${color}`}
                  >
                    <Icon size={34} aria-hidden />
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-bold">{persona.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink/60">{persona.text}</p>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
