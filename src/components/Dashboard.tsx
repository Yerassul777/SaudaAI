import { useNavigate } from "react-router-dom";
import { Camera, BookOpen, Store, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang } from "../context/AppContext";
import AppHeader from "./AppHeader";
import { OrnamentDivider } from "./Ornament";

/*
  Dashboard — хаб. Всё приложение держится на трёх больших кнопках:
  «Создать карточку» (главная, пульсирует), «Научиться продавать», «Тренироваться».
  Карточки и прогресс переехали в профиль (иконка в шапке).
*/
export default function Dashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const name = (user?.user_metadata?.name as string) ?? "";

  const actions = [
    {
      to: "/app/new",
      icon: Camera,
      title: t.app.createBtn,
      desc: t.app.createDesc,
      // Главная кнопка: крупнее, терракота, пульс
      className: "bg-terracotta text-white shadow-xl shadow-terracotta/25 btn-pulse",
      descClass: "text-white/80",
      main: true,
    },
    {
      to: "/app/learn",
      icon: BookOpen,
      title: t.app.learnBtn,
      desc: t.app.learnDesc,
      className: "bg-forest text-white shadow-lg shadow-ink/10",
      descClass: "text-white/75",
      main: false,
    },
    {
      to: "/app/practice",
      icon: Store,
      title: t.app.practiceBtn,
      desc: t.app.practiceDesc,
      className: "bg-burgundy text-white shadow-lg shadow-ink/10",
      descClass: "text-white/75",
      main: false,
    },
  ];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">
            {t.app.greeting} {name}!
          </h1>
          <p className="mt-2 text-lg text-ink/60">{t.app.lead}</p>
          <OrnamentDivider className="mt-6 text-terracotta" />
        </motion.div>

        {/* Три кнопки: стопка на телефоне, главная — заметно крупнее */}
        <div className="mt-10 flex flex-col gap-4">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.to}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.to)}
                className={`flex w-full items-center gap-5 rounded-3xl px-6 text-left ${
                  action.main ? "py-8" : "py-6"
                } ${action.className}`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-2xl bg-white/15 ${
                    action.main ? "h-16 w-16" : "h-14 w-14"
                  }`}
                >
                  <Icon size={action.main ? 32 : 26} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block font-heading font-extrabold leading-tight ${
                      action.main ? "text-2xl" : "text-xl"
                    }`}
                  >
                    {action.title}
                  </span>
                  <span className={`mt-1 block text-sm ${action.descClass}`}>
                    {action.desc}
                  </span>
                </span>
                <ChevronRight size={24} className="shrink-0 opacity-60" aria-hidden />
              </motion.button>
            );
          })}
        </div>
      </main>
    </>
  );
}
