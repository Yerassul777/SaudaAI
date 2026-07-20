import { Camera, MessageCircleQuestion, Sparkles } from "lucide-react";
import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  HowItWorks — секция "Как это работает": 3 простых шага.
  id="how" нужен, чтобы пункт меню и кнопка героя могли
  прокрутить страницу прямо сюда.
*/

type Props = { t: Content };

const icons = [Camera, MessageCircleQuestion, Sparkles];

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
        {t.how.steps.map((step, i) => {
          const Icon = icons[i];
          return (
            <FadeIn key={step.title} delay={i * 0.12}>
              <li className="relative h-full rounded-3xl bg-surface p-7 shadow-sm shadow-ink/5">
                {/* Большой номер шага */}
                <span
                  aria-hidden
                  className="absolute right-6 top-5 font-heading text-5xl font-extrabold text-beige"
                >
                  {i + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-white">
                  <Icon size={24} aria-hidden />
                </span>
                <h3 className="mt-5 font-heading text-xl font-bold">
                  {i + 1}. {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink/60">{step.text}</p>
              </li>
            </FadeIn>
          );
        })}
      </ol>
    </section>
  );
}
