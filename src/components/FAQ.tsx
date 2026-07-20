import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Content } from "../content";
import FadeIn from "./FadeIn";

/*
  FAQ — аккордеон с частыми вопросами.
  Принцип работы: в состоянии храним номер открытого вопроса.
  Кликнули по вопросу — он открылся, кликнули ещё раз — закрылся.
  id="faq" — для прокрутки из меню.
*/

type Props = { t: Content };

export default function FAQ({ t }: Props) {
  // Номер открытого вопроса. null — все закрыты. Первый открыт по умолчанию.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(index: number) {
    // Если кликнули по уже открытому — закрываем (ставим null)
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
      <FadeIn>
        <h2 className="text-center font-heading text-3xl font-extrabold md:text-4xl">
          {t.faq.title}
        </h2>
      </FadeIn>

      <div className="mt-10 flex flex-col gap-3">
        {t.faq.items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <FadeIn key={item.q} delay={i * 0.06}>
              <div className="overflow-hidden rounded-2xl bg-surface shadow-sm shadow-ink/5">
                {/* Кнопка-вопрос. aria-expanded сообщает скринридерам, открыт ли ответ */}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-heading font-bold transition-colors hover:text-terracotta"
                >
                  {item.q}
                  <ChevronDown
                    size={20}
                    aria-hidden
                    className={`shrink-0 text-terracotta transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Ответ показываем только если вопрос открыт */}
                {isOpen && (
                  <p className="px-6 pb-5 leading-relaxed text-ink/60">{item.a}</p>
                )}
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
