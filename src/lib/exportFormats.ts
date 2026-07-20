/*
  Экспорт карточки под конвенции площадок — чистое клиентское форматирование
  из уже сгенерированных полей, без новых вызовов ИИ.

  Kaspi — название компактно, описание абзацем, без хэштегов.
  OLX   — название + описание + цена + строка про торг.
  WB    — название с ключевыми словами + буллеты характеристик.
*/
import type { Lang } from "../content";

type CardFields = {
  title_ru: string;
  title_kz: string;
  description_ru: string;
  description_kz: string;
  tags: string[];
  price: number | null;
};

export type ExportTarget = "kaspi" | "olx" | "wildberries";

const labels: Record<Lang, { price: string; bargain: string; specs: string }> = {
  ru: { price: "Цена", bargain: "Возможен небольшой торг.", specs: "Характеристики" },
  kz: { price: "Баға", bargain: "Аздап саудаласуға болады.", specs: "Сипаттамалары" },
};

export function formatForMarketplace(
  target: ExportTarget,
  card: CardFields,
  lang: Lang
): string {
  const title = lang === "kz" ? card.title_kz : card.title_ru;
  const description = lang === "kz" ? card.description_kz : card.description_ru;
  const l = labels[lang];
  const priceLine =
    card.price && card.price > 0 ? `${l.price}: ${card.price.toLocaleString("ru-RU")} ₸` : "";

  if (target === "kaspi") {
    // Kaspi: чисто и по-магазинному, без тегов и лишнего
    return [title, "", description, "", priceLine].filter(Boolean).join("\n");
  }

  if (target === "olx") {
    // OLX: живое объявление + сигнал о торге
    return [title, "", description, "", priceLine, l.bargain].filter(Boolean).join("\n");
  }

  // Wildberries: ключевые слова в названии + буллеты
  const keywords = card.tags.slice(0, 3).join(", ");
  const bullets = card.tags.map((tag) => `• ${tag}`).join("\n");
  return [
    keywords ? `${title} — ${keywords}` : title,
    "",
    description,
    "",
    l.specs + ":",
    bullets,
    "",
    priceLine,
  ]
    .filter(Boolean)
    .join("\n");
}
