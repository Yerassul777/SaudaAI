import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Brand from "./Brand";

/*
  Экран ожидания для долгих действий ИИ.

  Крутящаяся иконка ничего не сообщает: человек десять секунд смотрит в пустоту
  и не понимает, работает ли программа. Поэтому здесь по очереди показывается,
  что именно сейчас делается («смотрю на фотографию», «сверяю цену с рынком»).
  Ожидание перестаёт быть пустым, а на защите со сцены заодно видно, что внутри
  не один запрос, а цепочка шагов.

  Фоном идёт фотография товара, которую человек только что снял: размытая и
  затемнённая. Так видно, что работа идёт именно с его товаром, и не нужны
  посторонние стоковые картинки.
*/

type Props = {
  title: string;
  /** Что делается прямо сейчас; сменяются по кругу, последний остаётся. */
  steps: readonly string[];
  /** Фотография товара для фона. Без неё экран просто однотонный. */
  photoUrl?: string | null;
  /** Сколько держать один шаг, мс. */
  interval?: number;
};

export default function Waiting({ title, steps, photoUrl, interval = 3200 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (steps.length < 2) return;
    const timer = setInterval(() => {
      // На последнем шаге останавливаемся: ответ может прийти в любой момент,
      // и бегать по кругу заново было бы враньём про прогресс
      setIndex((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
    }, interval);
    return () => clearInterval(timer);
  }, [steps.length, interval]);

  return (
    <main className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center overflow-hidden px-4 text-center">
      {photoUrl && (
        <>
          {/* Фото сильно размыто и приглушено: это фон, а не картинка.
              Текст поверх должен читаться и на ярком мёде, и на тёмной коже */}
          <img
            src={photoUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl saturate-[0.55]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-bg/90"
          />
        </>
      )}

      <div className="relative flex flex-col items-center">
        {/* Знак дышит, а вокруг расходится круг: движение есть, но оно
            спокойное. Быстрое вращение рядом с крупным текстом утомляет */}
        <span className="relative flex h-20 w-20 items-center justify-center">
          <motion.span
            aria-hidden
            initial={{ scale: 0.7, opacity: 0.55 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-3xl bg-terracotta"
          />
          <motion.span
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-terracotta text-white shadow-lg"
          >
            <Brand size={34} />
          </motion.span>
        </span>

        <h1 className="mt-7 font-heading text-2xl font-extrabold">{title}</h1>

        <div className="mt-3 flex h-14 max-w-sm items-start justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              aria-live="polite"
              className="text-lg leading-snug text-ink/70"
            >
              {steps[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-1 flex gap-2" aria-hidden>
          {steps.map((step, i) => (
            <span
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                i <= index ? "w-7 bg-terracotta" : "w-2 bg-ink/15"
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
