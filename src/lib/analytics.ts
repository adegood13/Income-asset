// Derived metrics over the analyses collection — shared by Dashboard & Reports.
import type { Analysis, AnalysisStatus } from "../types";

export function avgConfidence(a: Analysis): number {
  const fields = a.documents.flatMap((d) => d.fields);
  if (!fields.length) return 0;
  return Math.round(fields.reduce((s, f) => s + f.confidence, 0) / fields.length);
}

export function overrideCount(a: Analysis): number {
  return a.documents.flatMap((d) => d.fields).filter((f) => f.overridden).length;
}

export function fieldCount(a: Analysis): number {
  return a.documents.reduce((s, d) => s + d.fields.length, 0);
}

export function allFieldConfidences(analyses: Analysis[]): number[] {
  return analyses.flatMap((a) => a.documents.flatMap((d) => d.fields.map((f) => f.confidence)));
}

export function countByStatus(analyses: Analysis[]): Record<AnalysisStatus, number> {
  const base: Record<AnalysisStatus, number> = {
    draft: 0,
    in_review: 0,
    calculated: 0,
    finalized: 0,
  };
  for (const a of analyses) base[a.status]++;
  return base;
}

// Fleet-wide average confidence across every captured field.
export function fleetAvgConfidence(analyses: Analysis[]): number {
  const all = allFieldConfidences(analyses);
  if (!all.length) return 0;
  return Math.round(all.reduce((s, c) => s + c, 0) / all.length);
}

// "Finalized this week" — within 7 days of the prototype's reference date.
export function finalizedThisWeek(analyses: Analysis[], refDate = new Date("2026-06-18")): number {
  const weekAgo = refDate.getTime() - 7 * 86400_000;
  return analyses.filter((a) => a.status === "finalized" && new Date(a.updatedAt).getTime() >= weekAgo)
    .length;
}
