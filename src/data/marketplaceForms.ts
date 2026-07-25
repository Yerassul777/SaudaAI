/*
  Формы «выставьте товар» для трёх площадок.

  Зачем это данными, а не тремя компонентами: у Kaspi, OLX и Wildberries
  по-настоящему разные кабинеты — разный набор полей, разный порядок шагов,
  разные обязательные вещи. Раньше тренажёр показывал одну форму в трёх цветах,
  и человек, потренировавшись у нас, приходил на настоящий Kaspi как в первый раз.

  Здесь лежит только структура — что и в каком порядке спрашивают. Все видимые
  подписи живут в content.ts на двух языках, чтобы форму можно было прочитать
  и по-казахски.

  Наборы полей собраны по официальным гайдам площадок (справка Kaspi для
  партнёров, инструкция WB Partners, бизнес-гайд OLX.kz), а не выдуманы.
*/

export type FieldSpec =
  /** Обычная строка. limit — мягкий предел: показываем счётчик и предупреждаем, но не обрезаем */
  | { kind: "text"; id: string; limit?: number }
  | { kind: "textarea"; id: string; rows: number }
  | { kind: "number"; id: string }
  | { kind: "select"; id: string }
  /** Крупные плитки вместо мелких радиокнопок — пальцем попасть проще */
  | { kind: "radioCards"; id: string }
  | { kind: "checkbox"; id: string }
  /** Артикул продавца с кнопкой «придумать за меня» — как «волшебная палочка» у WB */
  | { kind: "article"; id: string }
  /** Габариты упаковки: длина, ширина, высота, вес — четыре поля в строку */
  | { kind: "dimensions"; id: string }
  /** Рамка «Фото» без реальной загрузки: в тренажёре важен порядок шагов, а не файл */
  | { kind: "photoStub"; id: string };

/** Правило разбора объявления. Сработало — показываем подсказку с ключом id. */
export type CheckRule = {
  id: string;
  when: (values: Record<string, string>) => boolean;
};

export type MarketForm = {
  sections: { id: string; fields: FieldSpec[] }[];
  /** Какие поля этой формы играют роль названия/категории/цены/описания для ИИ */
  aiMap: { title: string; category: string; price: string; description: string };
  submitIcon?: "check";
  checks: CheckRule[];
};

/** Пусто ли поле (с учётом пробелов). */
const empty = (values: Record<string, string>, id: string) =>
  (values[id] ?? "").trim() === "";

/** Общее для всех площадок: описание в одну строку не продаёт. */
const shortDescription = (descriptionId: string): CheckRule => ({
  id: "shortDescription",
  when: (values) => (values[descriptionId] ?? "").trim().length < 80,
});

export const marketplaceForms: Record<string, MarketForm> = {
  /*
    Kaspi Магазин. Здесь не «объявление», а карточка товара в магазине:
    сначала категория, потом характеристики, и только потом цена и наличие.
    Карточка уходит на модерацию — об этом честно предупреждаем.
  */
  kaspi: {
    sections: [
      { id: "category", fields: [{ kind: "select", id: "category" }] },
      {
        id: "card",
        fields: [
          { kind: "text", id: "title" },
          { kind: "text", id: "brand" },
          { kind: "text", id: "spec1" },
          { kind: "text", id: "spec2" },
          { kind: "textarea", id: "description", rows: 4 },
        ],
      },
      {
        id: "sale",
        fields: [
          { kind: "number", id: "price" },
          { kind: "select", id: "city" },
        ],
      },
    ],
    aiMap: { title: "title", category: "category", price: "price", description: "description" },
    checks: [
      {
        id: "kaspiSpecs",
        when: (values) => empty(values, "spec1") && empty(values, "spec2"),
      },
      { id: "kaspiCategory", when: (values) => empty(values, "category") },
      shortDescription("description"),
    ],
  },

  /*
    OLX. Частное объявление: начинается с фотографий, а состояние товара
    и «договорная цена» тут важнее любых характеристик — по ним ищут покупатели.
  */
  olx: {
    sections: [
      { id: "photos", fields: [{ kind: "photoStub", id: "photos" }] },
      {
        id: "about",
        fields: [
          { kind: "text", id: "title" },
          { kind: "select", id: "rubric" },
          { kind: "radioCards", id: "condition" },
          { kind: "textarea", id: "description", rows: 4 },
        ],
      },
      {
        id: "deal",
        fields: [
          { kind: "number", id: "price" },
          { kind: "checkbox", id: "negotiable" },
          { kind: "checkbox", id: "exchange" },
        ],
      },
      {
        id: "contacts",
        fields: [
          { kind: "select", id: "city" },
          { kind: "radioCards", id: "sellerType" },
        ],
      },
    ],
    aiMap: { title: "title", category: "rubric", price: "price", description: "description" },
    checks: [
      { id: "olxCondition", when: (values) => empty(values, "condition") },
      { id: "olxCity", when: (values) => empty(values, "city") },
      shortDescription("description"),
    ],
  },

  /*
    Wildberries. Самый строгий кабинет: наименование до 60 знаков, свой артикул,
    бренд, габариты упаковки. Именно эти поля обычно и роняют карточку в черновики.
  */
  wildberries: {
    sections: [
      {
        id: "main",
        fields: [
          { kind: "text", id: "title", limit: 60 },
          { kind: "select", id: "category" },
          { kind: "article", id: "article" },
          { kind: "select", id: "brand" },
        ],
      },
      {
        id: "props",
        fields: [
          { kind: "text", id: "color" },
          { kind: "text", id: "composition" },
          { kind: "textarea", id: "description", rows: 4 },
        ],
      },
      {
        id: "logistics",
        fields: [
          { kind: "number", id: "price" },
          { kind: "dimensions", id: "dims" },
        ],
      },
    ],
    aiMap: { title: "title", category: "category", price: "price", description: "description" },
    checks: [
      { id: "wbTitleLong", when: (values) => (values.title ?? "").trim().length > 60 },
      { id: "wbArticle", when: (values) => empty(values, "article") },
      {
        id: "wbDims",
        when: (values) =>
          empty(values, "dimsL") ||
          empty(values, "dimsW") ||
          empty(values, "dimsH") ||
          empty(values, "dimsKg"),
      },
      shortDescription("description"),
    ],
  },
};
