import { FileQuestion, Banknote, Clock, Languages } from "lucide-react";
import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  ProblemSection — секция "Знакомо?".
  Показываем 4 карточки с типичными "болями" мастеров и фермеров,
  чтобы посетитель узнал в них себя.
*/

type Props = { t: Content };

// Иконки для карточек (порядок совпадает с текстами в content.ts)
const icons = [FileQuestion, Banknote, Clock, Languages];

export default function ProblemSection({ t }: Props) {
  return (
    <section className="bg-beige/60 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-center font-heading text-3xl font-extrabold md:text-4xl">
            {t.problem.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-ink/60">
            {t.problem.subtitle}
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.problem.cards.map((card, i) => {
            const Icon = icons[i];
            return (
              <FadeIn key={card.title} delay={i * 0.1}>
                <article className="h-full rounded-3xl bg-surface p-6 shadow-sm shadow-ink/5 transition-shadow hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{card.text}</p>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
