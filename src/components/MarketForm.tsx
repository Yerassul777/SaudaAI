import { ImagePlus, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { marketplaceForms, type FieldSpec } from "../data/marketplaceForms";
import type { Market } from "../data/practice";
import Field from "./Field";

/*
  MarketForm — форма «выставьте товар» для конкретной площадки.

  Один рендерер на три площадки: что именно спрашивать и в каком порядке,
  описано данными в data/marketplaceForms.ts, подписи — в content.ts.
  Добавить четвёртую площадку можно, не трогая этот файл.

  Поля намеренно крупные: аудитория — продавцы, которые не привыкли
  к мелким интерфейсам маркетплейсов.
*/

/** Тексты одной площадки. Наборы полей разные, поэтому ключи — обычные строки. */
type MarketTexts = {
  brand: string;
  breadcrumb: string;
  submit: string;
  note: string;
  sections: Record<string, string>;
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  hints: Record<string, string>;
  options: Record<string, string[]>;
};

/** Артикул в духе WB: короткий, читаемый вслух по телефону. */
function makeArticle(): string {
  return `SA-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function MarketForm({
  market,
  values,
  onChange,
  onSubmit,
  error,
}: {
  market: Market;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onSubmit: () => void;
  error?: string;
}) {
  const { t } = useLang();
  const p = t.practice;
  const form = marketplaceForms[market.id];
  const texts = p.forms[market.id] as unknown as MarketTexts;

  const inputClass =
    "w-full rounded-xl border-2 border-ink/10 bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-forest";

  function renderField(field: FieldSpec) {
    const label = texts.labels[field.id] ?? field.id;
    const placeholder = texts.placeholders[field.id];
    const hint = texts.hints[field.id];
    const value = values[field.id] ?? "";

    switch (field.kind) {
      case "text": {
        const over = field.limit ? value.length - field.limit : 0;
        return (
          <div key={field.id}>
            <Field
              id={field.id}
              label={label}
              placeholder={placeholder}
              hint={hint}
              value={value}
              onChange={(next) => onChange(field.id, next)}
            />
            {field.limit && (
              // Счётчик как в кабинете WB: видно заранее, что название не влезает
              <p
                className={`mt-1 text-sm font-semibold ${
                  over > 0 ? "text-terracotta" : "text-ink/40"
                }`}
              >
                {over > 0
                  ? p.charsOver.replace("{n}", String(over))
                  : p.charsLeft.replace("{n}", String(field.limit - value.length))}
              </p>
            )}
          </div>
        );
      }

      case "textarea":
        return (
          <div key={field.id}>
            <label htmlFor={field.id} className="mb-1.5 block text-sm font-semibold">
              {label}
            </label>
            <textarea
              id={field.id}
              rows={field.rows}
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange(field.id, e.target.value)}
              className={`${inputClass} leading-relaxed`}
            />
          </div>
        );

      case "number":
        return (
          <Field
            key={field.id}
            id={field.id}
            label={label}
            placeholder={placeholder}
            hint={hint}
            inputMode="numeric"
            value={value}
            onChange={(next) => onChange(field.id, next.replace(/\D/g, ""))}
          />
        );

      case "select": {
        // Первый вариант — приглашение выбрать, у него пустое значение
        const options = texts.options[field.id] ?? [];
        return (
          <div key={field.id}>
            <label htmlFor={field.id} className="mb-1.5 block text-sm font-semibold">
              {label}
            </label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              className={inputClass}
            >
              {options.map((option, i) => (
                <option key={option} value={i === 0 ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      }

      case "radioCards": {
        const options = texts.options[field.id] ?? [];
        return (
          <div key={field.id}>
            <p className="mb-1.5 text-sm font-semibold">{label}</p>
            <div className="flex flex-wrap gap-3">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(field.id, option)}
                  aria-pressed={value === option}
                  className={`min-w-[7rem] flex-1 rounded-xl border-2 px-5 py-3.5 font-semibold transition-colors ${
                    value === option
                      ? "border-forest bg-forest text-white"
                      : "border-ink/10 bg-surface hover:border-forest/40"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      }

      case "checkbox": {
        const checked = value === "1";
        return (
          <button
            key={field.id}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => onChange(field.id, checked ? "" : "1")}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-ink/10 bg-surface px-4 py-3.5 text-left font-semibold transition-colors hover:border-forest/40"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${
                checked ? "border-forest bg-forest text-white" : "border-ink/20"
              }`}
            >
              {checked && "✓"}
            </span>
            {label}
          </button>
        );
      }

      case "article":
        return (
          <div key={field.id}>
            <label htmlFor={field.id} className="mb-1.5 block text-sm font-semibold">
              {label}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id={field.id}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => onChange(field.id, makeArticle())}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-beige px-5 py-3 font-semibold transition-colors hover:bg-sun/30"
              >
                <Wand2 size={18} aria-hidden />
                {p.generateArticle}
              </button>
            </div>
            {hint && <p className="mt-1.5 text-sm text-ink/50">{hint}</p>}
          </div>
        );

      case "dimensions":
        return (
          <div key={field.id}>
            <p className="mb-1.5 text-sm font-semibold">{label}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["L", "W", "H", "Kg"] as const).map((part) => {
                const id = `${field.id}${part}`;
                return (
                  <div key={id}>
                    <input
                      id={id}
                      inputMode="numeric"
                      aria-label={texts.labels[id] ?? id}
                      value={values[id] ?? ""}
                      onChange={(e) => onChange(id, e.target.value.replace(/[^\d.,]/g, ""))}
                      className={`${inputClass} px-3`}
                    />
                    <p className="mt-1 text-center text-xs text-ink/50">
                      {texts.labels[id] ?? id}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "photoStub":
        return (
          <div key={field.id}>
            <p className="mb-1.5 text-sm font-semibold">{label}</p>
            <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-ink/20 bg-beige/60 px-5 py-6">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface text-ink/40">
                <ImagePlus size={28} aria-hidden />
              </span>
              <p className="text-ink/60">{hint}</p>
            </div>
          </div>
        );
    }
  }

  return (
    <div>
      {/* Шапка «кабинета»: название площадки и путь, по которому туда попадают */}
      <div className={`rounded-t-3xl px-6 py-4 ${market.accentBg} ${market.accentText}`}>
        <p className="font-heading text-xl font-extrabold">{texts.brand}</p>
        <p className="mt-0.5 text-sm opacity-75">{texts.breadcrumb}</p>
      </div>

      <div className={`rounded-b-3xl border-2 border-t-0 bg-surface p-6 ${market.cardBorder}`}>
        {form.sections.map((section, index) => (
          <section key={section.id} className={index === 0 ? "" : "mt-8"}>
            <h2 className="font-heading text-lg font-bold">
              {texts.sections[section.id] ?? ""}
            </h2>
            <div className="mt-4 flex flex-col gap-5">
              {section.fields.map(renderField)}
            </div>
          </section>
        ))}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 font-medium text-terracotta"
          >
            {error}
          </p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onSubmit}
          className={`mt-7 w-full rounded-2xl px-8 py-4 text-lg font-bold shadow-lg ${market.accentBg} ${market.accentText}`}
        >
          {texts.submit}
        </motion.button>

        {/* Что произойдёт на настоящей площадке после нажатия */}
        <p className="mt-3 text-center text-sm text-ink/50">{texts.note}</p>
      </div>
    </div>
  );
}
