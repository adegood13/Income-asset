import { ChevronDown, RefreshCw, Scale, Lock } from "lucide-react";
import type { Analysis } from "../types";
import { getMethodsForModule, getMethod } from "../mock/rules";
import { formatMoney } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";

interface Props {
  analysis: Analysis;
  locked: boolean;
  onMethodChange: (methodId: string) => void;
  onRecalc: () => void;
}

export function CalculationPanel({ analysis, locked, onMethodChange, onRecalc }: Props) {
  const methods = getMethodsForModule(analysis.module);
  const currentMethod = getMethod(analysis.method ?? "");
  const result = analysis.result;
  const resultLabel = analysis.module === "income" ? "Qualifying monthly income" : "Qualifying assets";
  const animated = useCountUp(result?.monthlyQualifying ?? 0);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Hero result */}
      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-navy text-white shadow-card">
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              {resultLabel}
            </span>
            {analysis.module === "income" ? (
              <span className="text-[11px] text-ink-500">/ month</span>
            ) : (
              <span className="text-[11px] text-ink-500">total</span>
            )}
          </div>
          <div className="mt-1.5 font-mono text-[40px] font-semibold leading-none tracking-tight">
            {result ? formatMoney(animated) : "—"}
          </div>
          {currentMethod && (
            <p className="mt-2 text-xs text-ink-400">{currentMethod.label}</p>
          )}
        </div>
        {/* gradient hairline */}
        <div className="mt-4 h-1 w-full bg-brand-gradient" />
      </div>

      {/* Method selector */}
      <div className="card p-4">
        <label className="eyebrow mb-2 block">Calculation method</label>
        <div className="relative">
          <select
            value={analysis.method ?? ""}
            disabled={locked}
            onChange={(e) => onMethodChange(e.target.value)}
            className="input appearance-none pr-9 font-medium disabled:opacity-60"
          >
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        </div>
        {currentMethod && <p className="mt-2 text-xs leading-relaxed text-ink-500">{currentMethod.blurb}</p>}

        {/* Future-feature stub */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-ink-400" />
            <span className="text-sm font-medium text-ink-500">Apply agency guidelines</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
              Coming soon
            </span>
            <span
              className="relative inline-flex h-5 w-9 cursor-not-allowed items-center rounded-full bg-ink-300 opacity-60"
              aria-disabled
            >
              <span className="ml-0.5 h-4 w-4 rounded-full bg-white" />
            </span>
          </div>
        </div>
      </div>

      {/* Lineage — the audit ledger */}
      <div className="card flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow">Calculation lineage</span>
          <span className="text-[11px] text-ink-400">input · operation · result</span>
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
                        last ? "bg-brand" : isFlag ? "bg-conf-low" : isSub ? "bg-navy" : "bg-ink-300"
                      }`}
                    />
                    <div
                      className={`flex items-start justify-between gap-3 rounded-lg px-2.5 py-1.5 ${
                        isSub ? "bg-ink-50" : isFlag ? "bg-[#FDECEC]/60" : ""
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
                        {step.result < 0 ? `(${formatMoney(Math.abs(step.result), { cents: true })})` : formatMoney(step.result, { cents: true })}
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
    </div>
  );
}
