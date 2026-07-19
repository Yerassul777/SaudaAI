import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, LogOut, LayoutGrid } from "lucide-react";
import { useAuth, useLang } from "../context/AppContext";

/*
  AppHeader — шапка личного кабинета: логотип, «Мои карточки»,
  переключатель языка и выход. Крупные зоны нажатия — интерфейс
  рассчитан на людей, которым мелкие кнопки неудобны.
*/
export default function AppHeader() {
  const { t, lang, setLang } = useLang();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink/5 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta text-white">
            <Sparkles size={20} aria-hidden />
          </span>
          <span className="font-heading text-xl font-extrabold">Sauda AI</span>
        </button>

        <div className="flex items-center gap-2">
          {location.pathname !== "/app/cards" && (
            <button
              type="button"
              onClick={() => navigate("/app/cards")}
              className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-beige sm:flex"
            >
              <LayoutGrid size={18} aria-hidden />
              {t.app.recentTitle}
            </button>
          )}

          {/* Переключатель языка — как на лендинге */}
          <div className="flex rounded-xl bg-beige p-1">
            {(["kz", "ru"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold uppercase transition-colors ${
                  lang === code ? "bg-white shadow-sm" : "text-ink/50"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title={t.app.logout}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-beige"
          >
            <LogOut size={18} aria-hidden />
            <span className="hidden sm:inline">{t.app.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
