import type { Content } from "../content";
import FadeIn from "./FadeIn";
import PlanCards from "./PlanCards";

/*
  Pricing — секция тарифов на лендинге.

  Стоит после «Кому это нужно» и перед вопросами: человек уже понял, что
  продукт делает, и следующий вопрос у него про деньги.
*/

type Props = { t: Content };

export default function Pricing({ t }: Props) {
  return (
    <section id="pricing" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-center font-heading text-3xl font-extrabold md:text-4xl">
            {t.pricing.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-ink/60">
            {t.pricing.subtitle}
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-12">
            <PlanCards t={t} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
