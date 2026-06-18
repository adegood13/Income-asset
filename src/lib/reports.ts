// Reporting datasets. Status volume, confidence distribution, and turn time are
// derived from real (mock) analyses; the override-rate trend is a synthetic but
// deterministic weekly series so the line chart reads well in the prototype.
import type { Analysis } from "../types";

export interface DateRange {
  id: string;
  label: string;
  days: number | null; // null => all time
}

export const DATE_RANGES: DateRange[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

const REF_DATE = new Date("2026-06-18T23:59:59");

export function filterByRange(analyses: Analysis[], days: number | null): Analysis[] {
  if (days == null) return analyses;
  const cutoff = REF_DATE.getTime() - days * 86400_000;
  return analyses.filter((a) => new Date(a.updatedAt).getTime() >= cutoff);
}

// Average turn time (hours) from createdAt -> updatedAt, by module.
export function turnTimeByModule(analyses: Analysis[]): { module: string; hours: number }[] {
  const acc: Record<string, { sum: number; n: number }> = {
    income: { sum: 0, n: 0 },
    asset: { sum: 0, n: 0 },
  };
  for (const a of analyses) {
    const hrs = (new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime()) / 3_600_000;
    acc[a.module].sum += Math.max(0, hrs);
    acc[a.module].n += 1;
  }
  return [
    { module: "Income", hours: acc.income.n ? Math.round(acc.income.sum / acc.income.n) : 0 },
    { module: "Asset", hours: acc.asset.n ? Math.round(acc.asset.sum / acc.asset.n) : 0 },
  ];
}

// Confidence distribution across every captured field, bucketed.
export function confidenceBuckets(analyses: Analysis[]): { range: string; count: number; tier: string }[] {
  const buckets = [
    { range: "<60", min: 0, max: 60, tier: "low", count: 0 },
    { range: "60–69", min: 60, max: 70, tier: "low", count: 0 },
    { range: "70–79", min: 70, max: 80, tier: "med", count: 0 },
    { range: "80–89", min: 80, max: 90, tier: "med", count: 0 },
    { range: "90–94", min: 90, max: 95, tier: "high", count: 0 },
    { range: "95–100", min: 95, max: 101, tier: "high", count: 0 },
  ];
  for (const a of analyses) {
    for (const d of a.documents) {
      for (const f of d.fields) {
        const b = buckets.find((x) => f.confidence >= x.min && f.confidence < x.max);
        if (b) b.count++;
      }
    }
  }
  return buckets.map(({ range, count, tier }) => ({ range, count, tier }));
}

// Synthetic weekly override-rate trend over the selected window.
export function overrideRateSeries(days: number | null): { week: string; rate: number }[] {
  const weeks = days == null ? 12 : Math.max(4, Math.round(days / 7));
  const out: { week: string; rate: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(REF_DATE.getTime() - i * 7 * 86400_000);
    // Gentle downward trend (process improving) with deterministic wobble.
    const base = 18 - (weeks - 1 - i) * (6 / weeks);
    const wobble = (Math.sin(i * 1.7) + Math.cos(i * 0.6)) * 1.6;
    const rate = Math.max(4, Math.round((base + wobble) * 10) / 10);
    out.push({ week: `${d.getMonth() + 1}/${d.getDate()}`, rate });
  }
  return out;
}
