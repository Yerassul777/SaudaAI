import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Check,
  MessageCircle,
  Trash2,
  Pencil,
  ImagePlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import {
  listCards,
  deleteCard,
  updateCard,
  generateImage,
  getPhotoUrl,
  type CardRow,
} from "../lib/api";
import AppHeader from "./AppHeader";

/*
  MyCards — сохранённые карточки. Карточка раскрывается по нажатию; внутри —
  полный текст, теги, цена (её можно поправить), кнопки «Скопировать» /
  «Пост» / «Сделать красивое фото» / «Удалить».
*/
export default function MyCards() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const c = t.cards;
  const r = t.result;

  const [cards, setCards] = useState<CardRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [genUrls, setGenUrls] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // Правка цены
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  // Генерация фото по карточке
  const [genState, setGenState] = useState<Record<string, "working" | "done">>({});

  useEffect(() => {
    listCards()
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  // Подтягиваем фото (оригинал и сгенерированное), когда карточку раскрыли
  useEffect(() => {
    if (!openId) return;
    const card = cards.find((row) => row.id === openId);
    if (!card) return;
    if (card.photo_path && !photoUrls[openId]) {
      getPhotoUrl("product-photos", card.photo_path).then((url) => {
        if (url) setPhotoUrls((prev) => ({ ...prev, [openId]: url }));
      });
    }
    if (card.generated_photo_path && !genUrls[openId]) {
      getPhotoUrl("generated-images", card.generated_photo_path).then((url) => {
        if (url) setGenUrls((prev) => ({ ...prev, [openId]: url }));
      });
    }
  }, [openId, cards, photoUrls, genUrls]);

  function cardText(card: CardRow): string {
    const title = lang === "kz" ? card.title_kz : card.title_ru;
    const description = lang === "kz" ? card.description_kz : card.description_ru;
    const tags = (card.tags ?? []).map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ");
    const priceLine = card.price_recommended
      ? `\n\n${card.price_recommended.toLocaleString("ru-RU")} ₸`
      : "";
    return `${title}\n\n${description}\n\n${tags}${priceLine}`;
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

  async function savePrice(id: string) {
    const value = parseInt(priceInput.replace(/\D/g, ""), 10);
    if (!Number.isFinite(value) || value <= 0) return;
    await updateCard(id, { price_recommended: value });
    setCards((prev) =>
      prev.map((row) => (row.id === id ? { ...row, price_recommended: value } : row))
    );
    setEditingId(null);
  }

  async function makePhoto(card: CardRow) {
    if (!card.photo_path || genState[card.id] === "working") return;
    setGenState((prev) => ({ ...prev, [card.id]: "working" }));
    try {
      const result = await generateImage(card.photo_path, card.title_ru);
      if (result.url) setGenUrls((prev) => ({ ...prev, [card.id]: result.url! }));
      await updateCard(card.id, { generated_photo_path: result.path });
      setCards((prev) =>
        prev.map((row) =>
          row.id === card.id ? { ...row, generated_photo_path: result.path } : row
        )
      );
      setGenState((prev) => ({ ...prev, [card.id]: "done" }));
    } catch {
      setGenState((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
    }
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
                  className="overflow-hidden rounded-2xl bg-surface shadow-sm"
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
                      {card.price_recommended
                        ? `${card.price_recommended.toLocaleString("ru-RU")} ₸`
                        : c.noPrice}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-ink/5 p-5">
                      <div className="flex flex-wrap gap-4">
                        {photoUrls[card.id] && (
                          <img
                            src={photoUrls[card.id]}
                            alt=""
                            className="h-36 w-36 rounded-xl object-cover shadow"
                          />
                        )}
                        {genUrls[card.id] && (
                          <a
                            href={genUrls[card.id]}
                            target="_blank"
                            rel="noreferrer"
                            title={r.photoReady}
                          >
                            <img
                              src={genUrls[card.id]}
                              alt=""
                              className="h-36 w-36 rounded-xl border-4 border-sun object-cover shadow"
                            />
                          </a>
                        )}
                      </div>

                      <p className="mt-4 leading-relaxed text-ink/70">
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

                      {/* Цена с правкой */}
                      <div className="mt-4 rounded-xl bg-beige p-4">
                        {editingId === card.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={priceInput}
                              onChange={(e) =>
                                setPriceInput(e.target.value.replace(/\D/g, ""))
                              }
                              placeholder={r.priceInputPlaceholder}
                              className="w-full rounded-lg border-2 border-ink/15 bg-surface px-3 py-2 font-semibold outline-none focus:border-forest sm:max-w-[180px]"
                            />
                            <button
                              type="button"
                              onClick={() => savePrice(card.id)}
                              className="rounded-lg bg-terracotta px-5 py-2 font-semibold text-white transition-colors hover:bg-terracotta-dark"
                            >
                              {r.savePrice}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-heading text-lg font-extrabold text-forest">
                              {card.price_recommended
                                ? `${card.price_recommended.toLocaleString("ru-RU")} ₸`
                                : c.noPrice}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPriceInput(
                                  card.price_recommended
                                    ? String(card.price_recommended)
                                    : ""
                                );
                                setEditingId(card.id);
                              }}
                              className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-sun/30"
                            >
                              <Pencil size={14} aria-hidden />
                              {c.edit}
                            </button>
                          </div>
                        )}
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
                          onClick={() => makePhoto(card)}
                          disabled={genState[card.id] === "working"}
                          className="flex items-center gap-2 rounded-xl bg-beige px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-sun/30 disabled:cursor-wait disabled:opacity-60"
                        >
                          <ImagePlus size={16} aria-hidden />
                          {genState[card.id] === "working" ? r.makingPhoto : r.makePhotoBtn}
                        </button>

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
