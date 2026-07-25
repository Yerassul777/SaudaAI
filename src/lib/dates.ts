/*
  Даты в интерфейсе.

  Штатный toLocaleDateString для казахской локали в браузере даёт не то, что
  ждёт человек: полную дату он отдаёт как «2026-07-25», а короткий месяц как
  «M07» вместо «шіл». Поэтому собираем строки сами. В Казахстане обе версии
  сайта читают один и тот же формат дд.мм.гггг, так что язык здесь не важен.
*/

/** 25.07.2026 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

/** «25 июл» / «25 шіл» — названия месяцев приходят из словаря языка. */
export function formatShortDate(iso: string, monthsShort: readonly string[]): string {
  const date = new Date(iso);
  return `${date.getDate()} ${monthsShort[date.getMonth()]}`;
}
