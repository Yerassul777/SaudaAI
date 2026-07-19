import { Sparkles, Camera, AtSign, Send } from "lucide-react";
import type { Content } from "../content";

/*
  Footer — подвал сайта.
  Логотип с коротким описанием, колонки ссылок-заглушек,
  иконки соцсетей и копирайт.
  Все ссылки ведут на "#" — это заглушки, как требует задание.
*/

type Props = { t: Content };

export default function Footer({ t }: Props) {
  // Соцсети: иконка + подпись для скринридеров.
  // В новых версиях lucide-react нет фирменных логотипов соцсетей,
  // поэтому используем близкие по смыслу нейтральные иконки.
  const socials = [
    { icon: Camera, label: "Instagram" },
    { icon: AtSign, label: "Facebook" },
    { icon: Send, label: "Telegram" },
  ];

  // Небольшой помощник, чтобы не повторять разметку колонок ссылок
  function LinkColumn({ title, links }: { title: string; links: string[] }) {
    return (
      <div>
        <h3 className="font-heading font-bold text-white">{title}</h3>
        <ul className="mt-4 flex flex-col gap-2.5">
          {links.map((link) => (
            <li key={link}>
              <a href="#" className="text-sm text-white/60 transition-colors hover:text-sun">
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <footer className="bg-ink py-14 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Логотип и описание */}
          <div>
            <a href="#top" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta text-white">
                <Sparkles size={18} aria-hidden />
              </span>
              <span className="font-heading text-xl font-extrabold">Sauda AI</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              {t.footer.about}
            </p>
          </div>

          <LinkColumn title={t.footer.productTitle} links={t.footer.productLinks} />
          <LinkColumn title={t.footer.companyTitle} links={t.footer.companyLinks} />

          {/* Соцсети */}
          <div>
            <h3 className="font-heading font-bold">{t.footer.socialTitle}</h3>
            <div className="mt-4 flex gap-3">
              {socials.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-terracotta hover:text-white"
                >
                  <Icon size={18} aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
