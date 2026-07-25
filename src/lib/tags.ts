/*
  Теги карточки.

  Показываем их одинаково в двух местах: на готовой карточке и в «Моих
  карточках». Модель иногда выдаёт один и тот же тег дважды («сатып алу»
  и «сатыпалу» после склейки пробелов совпадают), поэтому повторы убираем.
*/

/** «#мёдснашейпасеки» — то, что человек вставит в объявление. */
export function hashtag(tag: string): string {
  return `#${tag.replace(/\s+/g, "")}`;
}

/** Готовые к показу теги: без пробелов, без пустых и без повторов. */
export function uniqueHashtags(tags: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags ?? []) {
    const value = hashtag(tag);
    const key = value.toLowerCase();
    if (value === "#" || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}
