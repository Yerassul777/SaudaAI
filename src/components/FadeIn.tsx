import { motion } from "framer-motion";
import type { ReactNode } from "react";

/*
  FadeIn — маленькая обёртка для анимации.
  Всё, что мы положим внутрь <FadeIn>...</FadeIn>, плавно "всплывёт"
  снизу вверх, когда пользователь доскроллит до этого блока.
  Используем framer-motion, чтобы не писать анимации вручную.
*/

type Props = {
  children: ReactNode; // содержимое, которое анимируем
  delay?: number; // задержка в секундах (для эффекта "по очереди")
  className?: string; // дополнительные css-классы
};

export default function FadeIn({ children, delay = 0, className }: Props) {
  return (
    <motion.div
      className={className}
      // начальное состояние: невидимый и чуть ниже своего места
      initial={{ opacity: 0, y: 24 }}
      // когда блок появился на экране: видимый и на своём месте
      whileInView={{ opacity: 1, y: 0 }}
      // once: true — анимация проигрывается один раз, а не при каждом скролле
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
