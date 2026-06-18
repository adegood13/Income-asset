// Confidence badge — the brand's signature data element. Shows the numeric
// score with a tier-colored ring so confidence reads at a glance everywhere a
// captured value appears.
import type { Confidence } from "../types";
import { CONFIDENCE_CLASSES, CONFIDENCE_LABEL, hexFor, tierFor } from "../lib/confidence";

interface Props {
  value: Confidence;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ConfidenceBadge({ value, size = "sm", showLabel = false }: Props) {
  const tier = tierFor(value);
  const hex = hexFor(value);
  const dim = size === "md" ? 30 : 24;
  const stroke = size === "md" ? 3 : 2.5;
  const r = (dim - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circ;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-1 py-0.5 ${CONFIDENCE_CLASSES[tier]}`}
      title={`${CONFIDENCE_LABEL[tier]} confidence — ${value}`}
    >
      <span className="relative inline-flex" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={stroke} />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={hex}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono font-semibold"
          style={{ fontSize: size === "md" ? 10 : 8.5, color: hex }}
        >
          {Math.round(value)}
        </span>
      </span>
      {showLabel && (
        <span className="pr-1.5 text-[11px] font-semibold">{CONFIDENCE_LABEL[tier]}</span>
      )}
    </span>
  );
}

// Compact dot-only variant for dense tables.
export function ConfidenceDot({ value }: { value: Confidence }) {
  const hex = hexFor(value);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
      <span className="font-mono text-xs font-semibold" style={{ color: hex }}>
        {Math.round(value)}
      </span>
    </span>
  );
}
