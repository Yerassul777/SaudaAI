import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { AppProviders, useAuth, useLang } from "./context/AppContext";

// Секции лендинга (по порядку сверху вниз)
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProblemSection from "./components/ProblemSection";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import BeforeAfter from "./components/BeforeAfter";
import Quote from "./components/Quote";
import Audience from "./components/Audience";
import FAQ from "./components/FAQ";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

// Экраны приложения
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import CreateCardWizard from "./components/CreateCardWizard";
import MyCards from "./components/MyCards";
import Profile from "./components/Profile";
import Learn from "./components/Learn";
import Practice from "./components/Practice";
import PracticeSession from "./components/PracticeSession";

/*
  App — точка сборки: провайдеры (язык + сессия) и маршруты.

  Маршруты:
    /            лендинг (открыт всем)
    /register    регистрация: телефон + ПИН
    /login       вход
    /app         дашборд (только после входа)
    /app/new     мастер создания карточки
    /app/cards   сохранённые карточки
*/

/** Лендинг: та же страница, что и раньше, но кнопки ведут на маршруты. */
function Landing() {
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Уже вошёл? Кнопка «Начать» ведёт сразу в приложение.
  const goToApp = () => navigate(user ? "/app" : "/register");

  return (
    <>
      <Navbar t={t} lang={lang} onLangChange={setLang} onRegister={goToApp} />
      <main>
        <Hero t={t} onRegister={goToApp} />
        <ProblemSection t={t} />
        <HowItWorks t={t} />
        <Features t={t} />
        <BeforeAfter t={t} />
        <Quote t={t} />
        <Audience t={t} />
        <FAQ t={t} />
        <CTASection t={t} onRegister={goToApp} />
      </main>
      <Footer t={t} />
    </>
  );
}

/** Защита приватных маршрутов: нет сессии — отправляем на вход. */
function RequireAuth() {
  const { user, loading } = useAuth();

  // Пока Supabase поднимает сессию из localStorage, ничего не дёргаем
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-terracotta border-t-transparent" />
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/new" element={<CreateCardWizard />} />
            <Route path="/app/cards" element={<MyCards />} />
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/app/learn" element={<Learn />} />
            <Route path="/app/practice" element={<Practice />} />
            <Route path="/app/practice/:market" element={<PracticeSession />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
