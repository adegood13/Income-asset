import { ChevronDown, RefreshCw, Scale, Lock, ExternalLink } from "lucide-react";
import type { Analysis } from "../types";
import { Sparkle } from "./Logo";
import { getMethodsForModule, getMethod, GUIDELINE_GROUPS, getGuidelineLabel } from "../mock/rules";
import { formatMoney } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";

interface Props {
  analysis: Analysis;
  locked: boolean;
  onMethodChange: (methodId: string) => void;
  onGuidelineChange: (guidelineId: string) => void;
  onRecalc: () => void;
  onPopOut?: () => void;
}

export function CalculationPanel({
  analysis,
  locked,
  onMethodChange,
  onGuidelineChange,
  onRecalc,
  onPopOut,
}: Props) {
  const methods = getMethodsForModule(analysis.module);
  const currentMethod = getMethod(analysis.method ?? "");
  const result = analysis.result;
  const resultLabel = analysis.module === "income" ? "Qualifying monthly income" : "Qualifying assets";
  const animated = useCountUp(result?.monthlyQualifying ?? 0);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Hero result — white figure on the AskBob sky gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient text-white shadow-lift">
        {/* faint sparkle motif, decorative */}
        <Sparkle size={150} color="#ffffff" className="pointer-events-none absolute -right-8 -top-10 opacity-[0.08]" />
        {onPopOut && (
          <button
            onClick={onPopOut}
            className="absolute right-2.5 top-2.5 z-10 rounded-md p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            title="Pop out into a separate window"
            aria-label="Pop out calculation panel"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
        <div className="relative px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
              {resultLabel}
            </span>
            <span className="pr-7 text-[11px] text-white/70">
              {analysis.module === "income" ? "/ month" : "total"}
            </span>
          </div>
          <div className="mt-1.5 font-mono text-[40px] font-semibold leading-none tracking-tight">
            {result ? formatMoney(animated) : "—"}
          </div>
          {currentMethod && <p className="mt-2 text-xs text-white/80">{currentMethod.label}</p>}
        </div>
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

        {/* Agency / investor guideline overlay — live selector, application is
            still a future feature (toggle stays disabled + "Coming soon"). */}
        <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-ink-400" />
              <span className="text-sm font-medium text-ink-700">Apply agency guidelines</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                Coming soon
              </span>
              <span
                className="relative inline-flex h-5 w-9 cursor-not-allowed items-center rounded-full bg-ink-300 opacity-60"
                aria-disabled
                title="Applying the overlay to the math is coming soon"
              >
                <span className="ml-0.5 h-4 w-4 rounded-full bg-white" />
              </span>
            </div>
          </div>

          <div className="relative mt-2">
            <select
              value={analysis.guideline ?? ""}
              disabled={locked}
              onChange={(e) => onGuidelineChange(e.target.value)}
              className="input appearance-none pr-9 text-sm disabled:opacity-60"
              aria-label="Agency or investor guideline"
            >
              <option value="">No overlay — base method only</option>
              {GUIDELINE_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          </div>

          {analysis.guideline ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
              Overlay selected — <span className="font-semibold text-brand">{getGuidelineLabel(analysis.guideline)}</span>.
              Guideline rules apply to the calculation in a future release.
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">
              Choose an agency or investor to preview where guideline overlays will plug in.
            </p>
          )}
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
