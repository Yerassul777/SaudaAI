import { useState, useEffect } from "react";
import { content } from "./content";
import type { Lang } from "./content";

// Компоненты-секции лендинга (по порядку сверху вниз)
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProblemSection from "./components/ProblemSection";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import BeforeAfter from "./components/BeforeAfter";
import Audience from "./components/Audience";
import FAQ from "./components/FAQ";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import RegisterPage from "./components/RegisterPage";

/*
  App — "сердце" приложения. Здесь живут два главных состояния:

  1. lang — выбранный язык ("ru" или "kz"). По нему берём тексты из словаря.
  2. screen — какой экран показываем: "landing" (главная) или "register".
     Роутер (react-router) не используем — для двух экранов достаточно useState.
*/

type Screen = "landing" | "register";

export default function App() {
  const [lang, setLang] = useState<Lang>("ru"); // по умолчанию русский
  const [screen, setScreen] = useState<Screen>("landing");

  // Тексты текущего языка. Передаём их во все компоненты через проп t.
  const t = content[lang];

  // При смене экрана прокручиваем страницу наверх,
  // чтобы регистрация не открывалась "посередине".
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // Экран регистрации — отдельная страница без шапки и футера
  if (screen === "register") {
    return <RegisterPage t={t} onBack={() => setScreen("landing")} />;
  }

  // Главная страница: все 10 секций по порядку
  return (
    <>
      <Navbar
        t={t}
        lang={lang}
        onLangChange={setLang}
        onRegister={() => setScreen("register")}
      />
      <main>
        <Hero t={t} onRegister={() => setScreen("register")} />
        <ProblemSection t={t} />
        <HowItWorks t={t} />
        <Features t={t} />
        <BeforeAfter t={t} />
        <Audience t={t} />
        <FAQ t={t} />
        <CTASection t={t} onRegister={() => setScreen("register")} />
      </main>
      <Footer t={t} />
    </>
  );
}
