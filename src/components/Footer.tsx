import { Sparkles, Instagram } from "lucide-react";
import type { Content } from "../content";

/*
  Footer — подвал. Бордовый фон работает в обеих темах (бело-кремовый текст
  всегда читается). Навигация — настоящие якоря по секциям, «О нас» и иконка
  Instagram ведут на наш аккаунт.
*/

const INSTAGRAM_URL = "https://www.instagram.com/saudaai2026/";

type Props = { t: Content };

export default function Footer({ t }: Props) {
  // Реальные якоря — те же, что в шапке
  const sections = [
    { label: t.nav.howItWorks, href: "#how" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.audience, href: "#audience" },
    { label: t.nav.faq, href: "#faq" },
  ];

  return (
    <footer className="bg-burgundy py-14 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr]">
          {/* Логотип и описание */}
          <div>
            <a href="#top" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta text-white">
                <Sparkles size={18} aria-hidden />
              </span>
              <span className="font-heading text-xl font-extrabold">Sauda AI</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              {t.footer.about}
            </p>
          </div>

          {/* Навигация по секциям */}
          <nav>
            <h3 className="font-heading font-bold">{t.footer.sectionsTitle}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {sections.map((section) => (
                <li key={section.href}>
                  <a
                    href={section.href}
                    className="text-sm text-white/70 transition-colors hover:text-sun"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Мы на связи: «О нас» и Instagram */}
          <div>
            <h3 className="font-heading font-bold">{t.footer.socialTitle}</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-white/70 transition-colors hover:text-sun"
                >
                  {t.footer.aboutUs}
                </a>
              </li>
            </ul>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-terracotta hover:text-white"
            >
              <Instagram size={20} aria-hidden />
            </a>
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/50">
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
