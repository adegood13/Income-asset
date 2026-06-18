// Confidence color coding — the single source of truth for the brand's
// confidence scale. Used everywhere a captured value appears.
//   High  (>= 90): AskBob Green  #19D467
//   Medium(70-89): amber         #F5A623
//   Low   (< 70) : red           #E5484D
import type { Confidence } from "../types";

export type ConfidenceTier = "high" | "med" | "low";

export function tierFor(c: Confidence): ConfidenceTier {
  if (c >= 90) return "high";
  if (c >= 70) return "med";
  return "low";
}

export const CONFIDENCE_HEX: Record<ConfidenceTier, string> = {
  high: "#19D467",
  med: "#F5A623",
  low: "#E5484D",
};

export const CONFIDENCE_LABEL: Record<ConfidenceTier, string> = {
  high: "High",
  med: "Medium",
  low: "Low",
};

// Tailwind class bundles per tier (text + soft background + border).
export const CONFIDENCE_CLASSES: Record<ConfidenceTier, string> = {
  high: "text-green-deep bg-green-tint border-green/30",
  med: "text-[#9A6300] bg-[#FFF6E5] border-[#F5A623]/35",
  low: "text-danger bg-danger-tint border-danger/30",
};

export function hexFor(c: Confidence): string {
  return CONFIDENCE_HEX[tierFor(c)];
}
