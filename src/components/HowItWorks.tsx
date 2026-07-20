import type { Content } from "../content";
import FadeIn from "./FadeIn";
import { OrnamentStep } from "./Ornament";

/*
  HowItWorks — «Как это работает»: 3 шага с номерами в орнаментных кружках
  (мотив казахского орнамента вместо безликих иконок).
*/

type Props = { t: Content };

export default function HowItWorks({ t }: Props) {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
      <FadeIn>
        <h2 className="text-center font-heading text-3xl font-extrabold md:text-4xl">
          {t.how.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-ink/60">
          {t.how.subtitle}
        </p>
      </FadeIn>

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {t.how.steps.map((step, i) => (
          <FadeIn key={step.title} delay={i * 0.12}>
            <li className="h-full rounded-3xl bg-surface p-7 text-center shadow-sm shadow-ink/5">
              <OrnamentStep number={i + 1} className="text-terracotta" />
              <h3 className="mt-5 font-heading text-xl font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-ink/60">{step.text}</p>
            </li>
          </FadeIn>
        ))}
      </ol>
    </section>
  );
}
