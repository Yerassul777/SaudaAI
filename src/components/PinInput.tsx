import { useRef, useState } from "react";

/*
  PinInput — ввод ПИНа в 4 крупные ячейки, как на банкомате.

  Под капотом один невидимый input поверх ячеек: так работает любая мобильная
  клавиатура, автозаполнение и вставка из буфера, а фокус не «прыгает» между
  четырьмя полями. Ячейки — только отображение.
*/

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  /** id для связки с label снаружи */
  id?: string;
};

export default function PinInput({ value, onChange, error, id }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.slice(0, 4).split("");
  const activeIndex = Math.min(value.length, 3);

  return (
    <div className="relative">
      {/* Невидимое настоящее поле ввода */}
      <input
        ref={inputRef}
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="ПИН, 4 цифры"
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />

      {/* Четыре ячейки-отображения */}
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => {
          const filled = digits[i] !== undefined;
          const isActive = focused && i === activeIndex && value.length < 4;
          return (
            <div
              key={i}
              aria-hidden
              className={`flex h-16 w-14 items-center justify-center rounded-2xl border-2 bg-surface text-3xl font-extrabold transition-colors ${
                error
                  ? "border-terracotta"
                  : isActive
                    ? "border-forest"
                    : filled
                      ? "border-ink/30"
                      : "border-ink/10"
              }`}
            >
              {filled ? "•" : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
