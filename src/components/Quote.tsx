import type { Content } from "../content";
import FadeIn from "./FadeIn";
import { OrnamentHorn } from "./Ornament";

/*
  Quote — широкая бордовая полоса с крупным утверждением
  (приём из референса Little Market: цветной блок-паузa между секциями).
*/

type Props = { t: Content };

export default function Quote({ t }: Props) {
  return (
    <section className="bg-burgundy py-16 text-white md:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <FadeIn>
          <OrnamentHorn size={44} className="mx-auto text-sun" />
          <p className="mt-6 font-heading text-2xl font-extrabold leading-snug md:text-4xl">
            {t.quote.text}
          </p>
          <p className="mt-5 text-lg text-white/75">{t.quote.sub}</p>
        </FadeIn>
      </div>
    </section>
  );
}
