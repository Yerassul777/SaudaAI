/*
  Два глобальных контекста приложения:

  1. LangContext — выбранный язык (ru/kz) и словарь текстов t.
     Раньше язык жил в App и передавался пропами; с появлением роутера
     и десятка экранов контекст избавляет от «протаскивания» пропов.

  2. AuthContext — текущая сессия Supabase. Подписываемся на изменения
     один раз здесь, а любой экран узнаёт пользователя через useAuth().
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

/* ===== Провайдер ===== */

export function AppProviders({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </LangContext.Provider>
  );
}
