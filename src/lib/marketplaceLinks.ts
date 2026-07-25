/*
  Куда ведут кнопки площадок с готовой карточки.

  Мы не пытаемся подставить текст в чужую форму — у Kaspi, OLX и Wildberries
  нет такой ссылки, и подделывать её нельзя. Поэтому схема честная:
  текст кладём в буфер обмена, а человека доводим до нужной страницы
  и объясняем, что нажать дальше.

  Адреса стоит перепроверять руками: площадки меняют их без предупреждения.
*/
import type { ExportTarget } from "./exportFormats";

export const marketplaceUrls: Record<ExportTarget, string> = {
  kaspi: "https://kaspi.kz/merchantcabinet/",
  olx: "https://www.olx.kz/post/",
  wildberries: "https://seller.wildberries.ru/",
};

/** Читаемое название площадки для заголовка и кнопки. */
export const marketplaceNames: Record<ExportTarget, string> = {
  kaspi: "Kaspi",
  olx: "OLX",
  wildberries: "Wildberries",
};

/**
 * WhatsApp — единственный случай, где текст подставляется сам:
 * wa.me принимает сообщение параметром, и продавцу остаётся выбрать получателя.
 */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
