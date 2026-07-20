import { useState } from "react";
import {
  Copy,
  Check,
  MessageCircle,
  ImagePlus,
  Save,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang } from "../context/AppContext";
import {
  saveCard,
  generateImage,
  type Answers,
  type GeneratedCard,
} from "../lib/api";

/*
  CardResult — готовая карточка: тексты на двух языках, цена с объяснением,
  теги и три действия: скопировать, взять пост для WhatsApp, сделать
  «студийное» фото. Кнопка «Сохранить» кладёт карточку в базу.
*/

type Props = {
  card: GeneratedCard;
  category: string;
  answers: Answers;
  photoPath: string;
  /** Подписанная ссылка на исходное фото — для превью */
  photoUrl: string | null;
  onNewCard: () => void;
};

export default function CardResult({
  card,
  category,
  answers,
  photoPath,
  photoUrl,
  onNewCard,
}: Props) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const r = t.result;

  const [copied, setCopied] = useState<"card" | "post" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageState, setImageState] = useState<"idle" | "working" | "done">("idle");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);

  // Цену можно поправить прямо здесь: если ИИ не смог оценить или продавец
  // передумал — вводит своё число, и карточка сразу берёт его.
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const effectivePrice = customPrice ?? (card.price_unknown ? null : card.price_recommended);
  const effectiveUserSet = customPrice !== null || card.price_is_user_set;

  function applyPrice() {
    const value = parseInt(priceInput.replace(/\D/g, ""), 10);
    if (Number.isFinite(value) && value > 0) {
      setCustomPrice(value);
      setEditingPrice(false);
    }
  }

  /** Полный текст карточки на выбранном языке — для вставки на маркетплейс */
  function cardText(): string {
    const title = lang === "kz" ? card.title_kz : card.title_ru;
    const description = lang === "kz" ? card.description_kz : card.description_ru;
    const tags = card.tags.map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ");
    const priceLine =
      effectivePrice !== null ? `\n\n${effectivePrice.toLocaleString("ru-RU")} ₸` : "";
    return `${title}\n\n${description}\n\n${tags}${priceLine}`;
  }

  async function copyText(kind: "card" | "post") {
    await navigator.clipboard.writeText(
      kind === "card" ? cardText() : card.social_post
    );
    setCopied(kind);
    setTimeout(() => setCopied(null), 2500);
  }

  async function handleSave() {
    if (!user || saving || saved) return;
    setSaving(true);
    try {
      await saveCard({
        userId: user.id,
        photoPath,
        generatedPhotoPath: generatedPath,
        category,
        answers,
        // Сохраняем с учётом ручной правки цены
        card: {
          ...card,
          price_recommended: effectivePrice ?? 0,
          price_is_user_set: effectiveUserSet,
          price_unknown: effectivePrice === null,
        },
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleMakePhoto() {
    if (imageState === "working") return;
    setImageState("working");
    try {
      const result = await generateImage(photoPath, card.title_ru);
      setGeneratedUrl(result.url);
      setGeneratedPath(result.path);
      setImageState("done");
    } catch {
      setImageState("idle");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="font-heading text-3xl font-extrabold">{r.title}</h1>

      {/* Фото: оригинал и, если сделали, студийное */}
      <div className="mt-6 flex flex-wrap gap-4">
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            className="h-40 w-40 rounded-2xl object-cover shadow-md"
          />
        )}
        {imageState === "done" && generatedUrl && (
          <a href={generatedUrl} target="_blank" rel="noreferrer" title={r.photoReady}>
            <img
              src={generatedUrl}
              alt=""
              className="h-40 w-40 rounded-2xl border-4 border-sun object-cover shadow-md"
            />
          </a>
        )}
      </div>

      {/* Тексты на двух языках */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {(
          [
            { label: r.ruBlock, title: card.title_ru, text: card.description_ru },
            { label: r.kzBlock, title: card.title_kz, text: card.description_kz },
          ] as const
        ).map((block) => (
          <div key={block.label} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40">
              {block.label}
            </p>
            <h2 className="mt-2 font-heading text-lg font-extrabold leading-snug">
              {block.title}
            </h2>
            <p className="mt-3 leading-relaxed text-ink/70">{block.text}</p>
          </div>
        ))}
      </div>

      {/* Теги */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Tag size={16} className="text-ink/40" aria-hidden />
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-beige px-3 py-1 text-sm font-medium text-ink/70"
          >
            #{tag.replace(/\s+/g, "")}
          </span>
        ))}
      </div>

      {/* Цена. Не смогли оценить → поле для своей цены прямо здесь.
          Иначе → число (цена продавца или предложение ИИ) с кнопкой «Изменить». */}
      {effectivePrice === null ? (
        <div className="mt-4 rounded-2xl border-2 border-sun bg-sun/15 p-6">
          <p className="font-heading text-lg font-extrabold">{r.priceUnknownTitle}</p>
          <p className="mt-2 leading-relaxed text-ink/70">{r.priceUnknownText}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
              placeholder={r.priceInputPlaceholder}
              className="w-full rounded-xl border-2 border-ink/15 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-forest sm:max-w-[220px]"
            />
            <button
              type="button"
              onClick={applyPrice}
              className="rounded-xl bg-terracotta px-6 py-3 font-semibold text-white transition-colors hover:bg-terracotta-dark"
            >
              {r.savePrice}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-forest p-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/70">
                {effectiveUserSet ? r.priceYours : r.priceSuggested}
              </p>
              <p className="mt-1 font-heading text-3xl font-extrabold">
                {effectivePrice.toLocaleString("ru-RU")} ₸
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPriceInput(String(effectivePrice));
                setEditingPrice((v) => !v);
              }}
              className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
            >
              {r.editPrice}
            </button>
          </div>

          {editingPrice && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                inputMode="numeric"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
                placeholder={r.priceInputPlaceholder}
                className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2.5 font-semibold text-white outline-none placeholder:text-white/40 focus:border-white sm:max-w-[200px]"
              />
              <button
                type="button"
                onClick={applyPrice}
                className="rounded-xl bg-white px-5 py-2.5 font-semibold text-forest transition-colors hover:bg-white/90"
              >
                {r.savePrice}
              </button>
            </div>
          )}

          {/* Ориентир и совет показываем только для оценки ИИ, не для ручной цены */}
          {customPrice === null && (
            <>
              <p className="mt-3 text-sm text-white/70">
                {r.priceRange}: {card.price_min.toLocaleString("ru-RU")}–
                {card.price_max.toLocaleString("ru-RU")} ₸
              </p>
              <p className="mt-3 border-t border-white/15 pt-3 text-sm leading-relaxed text-white/85">
                <span className="font-semibold">{r.whyPrice}:</span> {card.price_rationale}
              </p>
            </>
          )}
        </div>
      )}

      {/* Действия */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => copyText("card")}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold shadow-sm transition-colors hover:bg-beige"
        >
          {copied === "card" ? <Check size={18} className="text-forest" aria-hidden /> : <Copy size={18} aria-hidden />}
          {copied === "card" ? r.copied : r.copy}
        </button>

        <button
          type="button"
          onClick={() => copyText("post")}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold shadow-sm transition-colors hover:bg-beige"
        >
          {copied === "post" ? <Check size={18} className="text-forest" aria-hidden /> : <MessageCircle size={18} aria-hidden />}
          {copied === "post" ? r.postCopied : r.postBtn}
        </button>

        <button
          type="button"
          onClick={handleMakePhoto}
          disabled={imageState === "working"}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold shadow-sm transition-colors hover:bg-beige disabled:cursor-wait disabled:opacity-60"
        >
          <ImagePlus size={18} aria-hidden />
          {imageState === "working" ? r.makingPhoto : r.makePhotoBtn}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center justify-center gap-2 rounded-xl bg-terracotta px-8 py-3.5 font-semibold text-white shadow-lg shadow-terracotta/25 transition-all hover:bg-terracotta-dark disabled:opacity-70"
        >
          {saved ? <Check size={18} aria-hidden /> : <Save size={18} aria-hidden />}
          {saved ? r.saved : r.saveBtn}
        </button>
      </div>

      <button
        type="button"
        onClick={onNewCard}
        className="mt-6 text-sm font-semibold text-forest underline-offset-2 hover:underline"
      >
        {r.newCard}
      </button>
    </motion.div>
  );
}
