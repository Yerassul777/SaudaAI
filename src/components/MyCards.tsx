import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, MessageCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import {
  listCards,
  deleteCard,
  getPhotoUrl,
  type CardRow,
} from "../lib/api";
import AppHeader from "./AppHeader";

/*
  MyCards — сохранённые карточки. Список раскрывается по нажатию:
  внутри полный текст, теги, цена и кнопки «Скопировать» / «Пост» / «Удалить».
*/
export default function MyCards() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const c = t.cards;
  const r = t.result;

  const [cards, setCards] = useState<CardRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    listCards()
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  // Подтягиваем подписанную ссылку на фото, когда карточку раскрыли
  useEffect(() => {
    if (!openId) return;
    const card = cards.find((row) => row.id === openId);
    if (!card?.photo_path || photoUrls[openId]) return;
    getPhotoUrl("product-photos", card.photo_path).then((url) => {
      if (url) setPhotoUrls((prev) => ({ ...prev, [openId]: url }));
    });
  }, [openId, cards, photoUrls]);

  function cardText(card: CardRow): string {
    const title = lang === "kz" ? card.title_kz : card.title_ru;
    const description = lang === "kz" ? card.description_kz : card.description_ru;
    const tags = (card.tags ?? []).map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ");
    return `${title}\n\n${description}\n\n${tags}\n\n${card.price_recommended?.toLocaleString("ru-RU")} ₸`;
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  }

  async function handleDelete(id: string) {
    await deleteCard(id);
    setCards((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 text-sm font-medium text-ink/60 transition-colors hover:text-terracotta"
        >
          <ArrowLeft size={18} aria-hidden />
          {c.back}
        </button>

        <h1 className="mt-4 font-heading text-3xl font-extrabold">{c.title}</h1>

        {cards.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-beige px-6 py-10 text-center text-ink/50">
            {c.empty}
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {cards.map((card) => {
              const isOpen = openId === card.id;
              return (
                <motion.li
                  key={card.id}
                  layout
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : card.id)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <div>
                      <p className="font-heading font-bold leading-snug">
                        {lang === "kz" ? card.title_kz : card.title_ru}
                      </p>
                      <p className="mt-1 text-sm text-ink/50">
                        {c.created}{" "}
                        {new Date(card.created_at).toLocaleDateString(
                          lang === "kz" ? "kk-KZ" : "ru-RU"
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 font-heading text-lg font-extrabold text-forest">
                      {card.price_recommended?.toLocaleString("ru-RU")} ₸
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-ink/5 p-5">
                      {photoUrls[card.id] && (
                        <img
                          src={photoUrls[card.id]}
                          alt=""
                          className="mb-4 h-36 w-36 rounded-xl object-cover shadow"
                        />
                      )}
                      <p className="leading-relaxed text-ink/70">
                        {lang === "kz" ? card.description_kz : card.description_ru}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(card.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-beige px-3 py-1 text-sm text-ink/70"
                          >
                            #{tag.replace(/\s+/g, "")}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => copyText(card.id, cardText(card))}
                          className="flex items-center gap-2 rounded-xl bg-beige px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-sun/30"
                        >
                          {copied === card.id ? (
                            <Check size={16} className="text-forest" aria-hidden />
                          ) : (
                            <Copy size={16} aria-hidden />
                          )}
                          {copied === card.id ? r.copied : r.copy}
                        </button>

                        {card.social_post && (
                          <button
                            type="button"
                            onClick={() => copyText(`post-${card.id}`, card.social_post)}
                            className="flex items-center gap-2 rounded-xl bg-beige px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-sun/30"
                          >
                            {copied === `post-${card.id}` ? (
                              <Check size={16} className="text-forest" aria-hidden />
                            ) : (
                              <MessageCircle size={16} aria-hidden />
                            )}
                            {r.postBtn}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(card.id)}
                          className="ml-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-terracotta transition-colors hover:bg-terracotta/10"
                        >
                          <Trash2 size={16} aria-hidden />
                          {c.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
