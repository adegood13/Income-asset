// AskBobAI logo — a sparkle "diamond" mark in AskBob Green paired with the
// Figtree Extra Bold wordmark. Per brand: the mark is always AskBob Green,
// the wordmark always Figtree Extra Bold, no effects, no recolor.

export function Sparkle({ size = 16, className, color = "currentColor" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <path
        d="M16 3.5c.9 7.8 4.7 11.6 12.5 12.5C20.7 16.9 16.9 20.7 16 28.5 15.1 20.7 11.3 16.9 3.5 16 11.3 15.1 15.1 11.3 16 3.5Z"
        fill={color}
      />
    </svg>
  );
}

export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-green"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Sparkle size={size * 0.62} color="#fff" />
    </span>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`font-display text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink-900"}`}
    >
      AskBob<span className="font-bold text-ink-400">AI</span>
    </span>
  );
}
