import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  Audience — «Кому это нужно»: три персоны с живыми фото товаров
  (сгенерированы нашей же функцией «студийное фото»). Стиль плиток —
  как в референсе: фото сверху, тёплая подложка, текст снизу.
*/

type Props = { t: Content };

const personaPhotos = ["/demo/ceramics.jpg", "/demo/kurt.jpg", "/demo/feltbag.jpg"];

export default function Audience({ t }: Props) {
  return (
    <section id="audience" className="scroll-mt-20 py-16 md:py-24">
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
          {t.audience.personas.map((persona, i) => (
            <FadeIn key={persona.title} delay={i * 0.12}>
              <article className="h-full overflow-hidden rounded-3xl bg-surface shadow-sm shadow-ink/5">
                <img
                  src={personaPhotos[i]}
                  alt=""
                  width={640}
                  height={640}
                  loading="lazy"
                  className="h-48 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="font-heading text-xl font-bold">{persona.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink/60">{persona.text}</p>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
