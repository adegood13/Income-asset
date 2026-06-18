import { RefreshCw, Lock, ExternalLink, Undo2, GitBranch } from "lucide-react";
import type { Analysis, CalcStep } from "../types";
import { formatMoney } from "../lib/format";

// Render a lineage step's result by its unit (money default, ratio, percent).
function formatStep(step: CalcStep): string {
  if (step.unit === "ratio") return `${step.result.toFixed(2)}×`;
  if (step.unit === "percent") return `${step.result}%`;
  return step.result < 0
    ? `(${formatMoney(Math.abs(step.result), { cents: true })})`
    : formatMoney(step.result, { cents: true });
}

interface Props {
  analysis: Analysis;
  locked: boolean;
  onRecalc: () => void;
  onPopOut?: () => void; // shown only when docked & not already in a popup
  popped?: boolean; // when true the docked slot shows a placeholder
  onReturn?: () => void; // re-dock from the placeholder
}

// The audit ledger: input · operation · running result. Extracted so it can be
// popped into its own window and viewed alongside the rest of the workspace.
export function CalculationLineage({ analysis, locked, onRecalc, onPopOut, popped, onReturn }: Props) {
  const result = analysis.result;

  if (popped) {
    return (
      <div className="card flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand shadow-card">
          <GitBranch className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">Lineage popped out</p>
          <p className="mt-1 text-xs text-ink-500">Open in a separate window for side-by-side review.</p>
        </div>
        <button className="btn-secondary px-3 py-1.5 text-xs" onClick={onReturn}>
          <Undo2 className="h-3.5 w-3.5" />
          Return here
        </button>
      </div>
    );
  }

  return (
    <div className="card flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">Calculation lineage</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-400">input · operation · result</span>
          {onPopOut && (
            <button
              onClick={onPopOut}
              className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              title="Pop out lineage into a separate window"
              aria-label="Pop out calculation lineage"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scroll-thin">
        {result && result.steps.length > 0 ? (
          <ol className="relative ml-1.5 border-l border-ink-200">
            {result.steps.map((step, i) => {
              const isSub = step.emphasis === "subtotal";
              const isFlag = step.emphasis === "flag";
              const last = i === result.steps.length - 1;
              return (
                <li key={i} className="relative pl-4 pb-3 last:pb-0">
                  <span
                    className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      last ? "bg-brand" : isFlag ? "bg-conf-low" : isSub ? "bg-ink-700" : "bg-ink-300"
                    }`}
                  />
                  <div
                    className={`flex items-start justify-between gap-3 rounded-lg px-2.5 py-1.5 ${
                      isSub ? "bg-ink-50" : isFlag ? "bg-danger-tint/60" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-sm ${isSub || last ? "font-semibold text-navy" : "font-medium text-ink-700"}`}>
                        {step.label}
                      </div>
                      <div className="text-[11px] text-ink-400">{step.detail}</div>
                    </div>
                    <div
                      className={`shrink-0 font-mono text-sm ${
                        isFlag ? "text-conf-low" : isSub || last ? "font-semibold text-navy" : "text-ink-700"
                      }`}
                    >
                      {formatStep(step)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="py-8 text-center text-sm text-ink-400">
            No calculation yet. Choose a method and recalculate.
          </p>
        )}
      </div>

      <button
        onClick={onRecalc}
        disabled={locked}
        className="btn-primary mt-4 w-full disabled:cursor-not-allowed"
      >
        {locked ? <Lock className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
        {locked ? "Finalized — locked" : "Recalculate"}
      </button>
    </div>
  );
}
