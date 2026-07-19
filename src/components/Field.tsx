/*
  Field — одно поле формы: подпись + input + сообщение об ошибке.
  Общий для регистрации, входа и мастера карточки.

  Важно: компонент объявлен в отдельном файле (а не внутри страницы) —
  иначе React пересоздавал бы input на каждый ввод и поле теряло бы фокус.
*/
type Props = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  hint?: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  /** Крупный центрированный ввод — для ПИНа */
  big?: boolean;
  onChange: (value: string) => void;
};

export default function Field(props: Props) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-semibold">
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        value={props.value}
        inputMode={props.inputMode}
        maxLength={props.maxLength}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={Boolean(props.error)}
        className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-forest ${
          props.error ? "border-terracotta" : "border-ink/10"
        } ${props.big ? "text-center font-heading text-3xl font-extrabold tracking-[0.5em]" : ""}`}
      />
      {props.hint && !props.error && (
        <p className="mt-1.5 text-sm text-ink/50">{props.hint}</p>
      )}
      {props.error && (
        <p role="alert" className="mt-1.5 text-sm font-medium text-terracotta">
          {props.error}
        </p>
      )}
    </div>
  );
}
