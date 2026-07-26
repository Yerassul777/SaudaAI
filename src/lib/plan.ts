/*
  Бесплатный план на стороне клиента.

  Здесь только то, что нужно показать человеку: сколько карточек осталось.
  Решение «можно или нельзя» принимает сервер в
  supabase/functions/generate-card/card.ts — клиентскую проверку обойти легко,
  серверную нет.

  Значения обязаны совпадать с FREE_CARDS_PER_MONTH и UNLIMITED_EMAILS
  в supabase/functions/generate-card/shared.ts.
*/

/** Сколько карточек в месяц входит в бесплатный план. */
export const FREE_CARDS_PER_MONTH = 5;

/** Номера, на которые лимит не действует: демо-аккаунт команды для защиты. */
const UNLIMITED_PHONES = ["+77759181572"];

export function isUnlimited(phone: string | null | undefined): boolean {
  return UNLIMITED_PHONES.includes((phone ?? "").trim());
}

/** Начало текущего календарного месяца в ISO — по нему считаем карточки. */
export function monthStartISO(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}

/** Сколько карточек осталось. Никогда не уходит ниже нуля. */
export function cardsLeft(used: number): number {
  return Math.max(0, FREE_CARDS_PER_MONTH - used);
}
