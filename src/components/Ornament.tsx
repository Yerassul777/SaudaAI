/*
  Казахские орнаменты как SVG-компоненты. Мотив — қошқар мүйіз («бараньи рога»):
  симметричные завитки-спирали. Рисуем штрихом через currentColor, поэтому цвет
  задаётся обычным text-классом Tailwind, а орнамент живёт в обеих темах.

  OrnamentDivider — горизонтальная лента-разделитель между секциями.
  OrnamentHorn    — одиночный элемент «рога» (для номеров шагов, буллетов).
*/

/** Один элемент «қошқар мүйіз»: пара встречных спиралей на стебле. */
export function OrnamentHorn({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={className}
    >
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        {/* стебель */}
        <path d="M24 44 V20" />
        {/* левый рог: завиток наружу и внутрь */}
        <path d="M24 22 C24 12, 12 10, 9 17 C7 22, 12 26, 16 23 C19 21, 18 17, 15 17" />
        {/* правый рог: зеркально */}
        <path d="M24 22 C24 12, 36 10, 39 17 C41 22, 36 26, 32 23 C29 21, 30 17, 33 17" />
      </g>
    </svg>
  );
}

/** Лента-разделитель: повторяющиеся рога, по центру — ромб. */
export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-4 overflow-hidden ${className}`}
    >
      <span className="h-px w-16 bg-current opacity-30 sm:w-28" />
      <OrnamentHorn size={26} className="opacity-60" />
      {/* ромб-шанырак по центру */}
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="opacity-70">
        <rect
          x="7"
          y="0.8"
          width="8.8"
          height="8.8"
          transform="rotate(45 7 0.8)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      <OrnamentHorn size={26} className="-scale-x-100 opacity-60" />
      <span className="h-px w-16 bg-current opacity-30 sm:w-28" />
    </div>
  );
}

/** Кружок с номером шага в орнаментной рамке. */
export function OrnamentStep({
  number,
  className = "",
}: {
  number: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex h-16 w-16 items-center justify-center ${className}`}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* четыре маленьких завитка по диагоналям */}
        {[45, 135, 225, 315].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 32 32)`}>
            <path
              d="M32 1.5 C36 4.5, 36 8.5, 32 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
      <span className="font-heading text-2xl font-extrabold">{number}</span>
    </span>
  );
}
