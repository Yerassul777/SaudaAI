/*
  Три глобальных контекста приложения:

  1. LangContext — выбранный язык (ru/kz) и словарь текстов t.
  2. AuthContext — текущая сессия Supabase.
  3. ThemeContext — светлая/тёмная тема. Ставит data-theme на <html>,
     CSS-переменные в index.css делают остальное. Выбор живёт в localStorage.
*/
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { content } from "../content";
import type { Content, Lang } from "../content";

/* ===== Язык ===== */

type LangValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Content;
};

const LangContext = createContext<LangValue | null>(null);

export function useLang(): LangValue {
  const value = useContext(LangContext);
  if (!value) throw new Error("useLang можно вызывать только внутри <AppProviders>");
  return value;
}

/* ===== Сессия ===== */

type AuthValue = {
  session: Session | null;
  user: User | null;
  /** true, пока не получили ответ от Supabase при загрузке страницы */
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth можно вызывать только внутри <AppProviders>");
  return value;
}

/* ===== Тема ===== */

type Theme = "light" | "dark";

type ThemeValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme можно вызывать только внутри <AppProviders>");
  return value;
}

/* ===== Провайдер ===== */

export function AppProviders({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<Theme>(() => {
    // Сохранённый выбор пользователя; по умолчанию светлая
    return localStorage.getItem("sauda-theme") === "dark" ? "dark" : "light";
  });

  // Атрибут на <html> — переключает все CSS-переменные разом
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (next: Theme) => {
    localStorage.setItem("sauda-theme", next);
    setThemeState(next);
  };

  useEffect(() => {
    // Поднимаем сессию из localStorage при загрузке страницы
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // И следим за входом/выходом дальше
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );
    return () => subscription.subscription.unsubscribe();
  }, []);

  const authValue: AuthValue = {
    session,
    user: session?.user ?? null,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: content[lang] }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      </ThemeContext.Provider>
    </LangContext.Provider>
  );
}
