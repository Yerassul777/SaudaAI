import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  CTASection — финальный яркий баннер с призывом к действию
  (CTA = call to action, "призыв к действию").
  Кнопка ведёт на экран регистрации.
*/

type Props = {
  t: Content;
  onRegister: () => void;
};

export default function CTASection({ t, onRegister }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[32px] bg-terracotta px-6 py-14 text-center text-white shadow-xl shadow-terracotta/30 md:py-16">
          {/* Декоративные круги на фоне */}
          <div aria-hidden className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-sun/20" />

          <h2 className="relative mx-auto max-w-2xl font-heading text-3xl font-extrabold md:text-4xl">
            {t.cta.title}
          </h2>
          <p className="relative mt-3 text-lg text-white/85">{t.cta.subtitle}</p>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onRegister}
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-terracotta shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            {t.cta.button}
            <ArrowRight size={18} aria-hidden />
          </motion.button>
        </div>
      </FadeIn>
    </section>
  );
}
