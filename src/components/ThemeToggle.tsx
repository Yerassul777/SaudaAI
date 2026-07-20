import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../context/AppContext";

/*
  ThemeToggle — кнопка светлая/тёмная тема. Живёт в шапках (лендинг и кабинет).
  Иконка показывает, КУДА переключишься: луна в светлой теме, солнце в тёмной.
*/
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-beige text-ink transition-colors hover:bg-sun/30 ${className}`}
    >
      {isDark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </motion.button>
  );
}
