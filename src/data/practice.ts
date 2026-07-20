/*
  Данные тренажёра: три площадки (узнаваемые цвета, БЕЗ логотипов — только
  названия текстом) и заготовленные вопросы «покупателя» для чата.
  ИИ подключается один раз — в конце, для разбора всей переписки.
*/
import type { Lang } from "../content";

export type Market = {
  id: "kaspi" | "olx" | "wildberries";
  name: string;
  /* Фирменные классы: узнаваемая палитра площадки */
  accentBg: string;
  accentText: string;
  cardBorder: string;
};

export const markets: Market[] = [
  {
    id: "kaspi",
    name: "Kaspi",
    accentBg: "bg-[#f14635]",
    accentText: "text-white",
    cardBorder: "border-[#f14635]",
  },
  {
    id: "olx",
    name: "OLX",
    accentBg: "bg-[#002f34]",
    accentText: "text-[#7df9d6]",
    cardBorder: "border-[#002f34]",
  },
  {
    id: "wildberries",
    name: "Wildberries",
    accentBg: "bg-[#7d31c9]",
    accentText: "text-white",
    cardBorder: "border-[#7d31c9]",
  },
];

/* Вопросы покупателя — по очереди, как в настоящем чате */
export const buyerQuestions: Record<Lang, string[]> = {
  ru: [
    "Здравствуйте! Товар ещё в наличии?",
    "А торг уместен? Могу забрать сегодня.",
    "Расскажите про состояние: всё как на фото?",
    "Доставка есть? Я из другого района.",
    "Хорошо, почему такая цена? У других видел дешевле.",
  ],
  kz: [
    "Сәлеметсіз бе! Тауар әлі бар ма?",
    "Саудаласуға бола ма? Бүгін алып кете аламын.",
    "Жағдайы қандай: бәрі фотодағыдай ма?",
    "Жеткізу бар ма? Мен басқа ауданнанмын.",
    "Жарайды, неге мұндай баға? Басқаларда арзанырақ көрдім.",
  ],
};
