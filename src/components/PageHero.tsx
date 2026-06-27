// Branded page hero — the AskBobAI "sky-gradient" surface that carries the mood
// (AskBob Blue → Cyan, per the brand guide). Used at the top of the primary
// pages so the product reads distinctly on-brand. The sparkle mark from the logo
// system is reused as a soft watermark. White text on the gradient reads well in
// both light and dark themes (the gradient is dark-anchored in both).

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Sparkle } from "./Logo";

interface Props {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, subtitle, icon: Icon, actions, children }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-7 shadow-lift sm:px-8 sm:py-8">
      {/* Sparkle watermark — brand motif, kept very subtle. */}
      <Sparkle
        size={240}
        color="rgba(255,255,255,0.09)"
        className="pointer-events-none absolute -right-10 -top-14 rotate-12"
      />
      <Sparkle
        size={120}
        color="rgba(255,255,255,0.07)"
        className="pointer-events-none absolute right-28 top-20 -rotate-6"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              {eyebrow}
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/75">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {children && <div className="relative mt-6">{children}</div>}
    </div>
  );
}

// Single-word editorial accent tuned for the gradient hero (Instrument Serif
// italic in AskBob bright cyan, which pops against the blue).
export function HeroAccent({ children }: { children: ReactNode }) {
  return <span className="font-serif italic text-brand-bright">{children}</span>;
}
