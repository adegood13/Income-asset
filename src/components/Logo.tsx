// AskBob wordmark + mark. The mark is a rounded navy tile with a gradient "B"
// and a green confidence dot — a tiny echo of the product's core idea.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-navy"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" width={size * 0.7} height={size * 0.7}>
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1181DE" />
            <stop offset="1" stopColor="#1F9AFF" />
          </linearGradient>
        </defs>
        <path
          d="M8 24V8h6.6c3 0 4.8 1.5 4.8 3.9 0 1.6-.9 2.7-2.4 3.2 1.9.4 3 1.8 3 3.6 0 2.5-2 4.3-5.2 4.3H8Zm3.2-9.3h3c1.3 0 2.1-.7 2.1-1.8s-.8-1.8-2.1-1.8h-3v3.6Zm0 6.4h3.3c1.4 0 2.3-.7 2.3-1.9s-.9-1.9-2.3-1.9h-3.3v3.8Z"
          fill="url(#bg)"
        />
        <circle cx="24.5" cy="22" r="2.6" fill="#0DC159" />
      </svg>
    </span>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`font-display text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}>
      Ask<span className="text-brand-bright">Bob</span>
      <span className={light ? "text-ink-400" : "text-ink-400"}>AI</span>
    </span>
  );
}
