import type { AnalysisStatus } from "../types";

const MAP: Record<AnalysisStatus, { label: string; cls: string; dot: string }> = {
  draft: { label: "Draft", cls: "bg-ink-100 text-ink-600 border-ink-200", dot: "#94A6B5" },
  in_review: { label: "In Review", cls: "bg-brand-tint text-brand border-brand/25", dot: "#1181DE" },
  calculated: { label: "Calculated", cls: "bg-[#FFF4E0] text-[#9A6300] border-[#F5A623]/30", dot: "#F5A623" },
  finalized: { label: "Finalized", cls: "bg-green-tint text-green-deep border-green/30", dot: "#0DC159" },
};

export function StatusChip({ status }: { status: AnalysisStatus }) {
  const s = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

export const STATUS_LABEL: Record<AnalysisStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  calculated: "Calculated",
  finalized: "Finalized",
};
