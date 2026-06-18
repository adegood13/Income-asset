import { ChevronDown, Scale, ExternalLink } from "lucide-react";
import type { Analysis } from "../types";
import { Sparkle } from "./Logo";
import { CalculationLineage } from "./CalculationLineage";
import { getMethodsForModule, getMethod, GUIDELINE_GROUPS, getGuidelineLabel } from "../mock/rules";
import { useApp } from "../state/AppContext";
import { formatMoney } from "../lib/format";
import { useCountUp } from "../lib/useCountUp";

interface Props {
  analysis: Analysis;
  locked: boolean;
  onMethodChange: (methodId: string) => void;
  onGuidelineChange: (guidelineId: string) => void;
  onRecalc: () => void;
  onPopOut?: () => void;
  onPopOutLineage?: () => void;
  lineagePopped?: boolean;
  onReturnLineage?: () => void;
}

export function CalculationPanel({
  analysis,
  locked,
  onMethodChange,
  onGuidelineChange,
  onRecalc,
  onPopOut,
  onPopOutLineage,
  lineagePopped,
  onReturnLineage,
}: Props) {
  const { config } = useApp();
  // Honor tenant rule config: hide methods/guidelines an admin has disabled.
  const methods = getMethodsForModule(analysis.module, analysis.documents).filter(
    (m) => !config.disabledMethods.includes(m.id),
  );
  const guidelineGroups = GUIDELINE_GROUPS.map((g) => ({
    group: g.group,
    options: g.options.filter((o) => !config.disabledGuidelines.includes(o.id)),
  })).filter((g) => g.options.length > 0);
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
            className="absolute right-2.5 top-2.5 z-10 rounded-md p-1.5 text-white/80 transition hover:bg-surface/15 hover:text-white"
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
                <span className="ml-0.5 h-4 w-4 rounded-full bg-surface" />
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
              {guidelineGroups.map((g) => (
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

      {/* Lineage — the audit ledger (extracted so it can pop out on its own) */}
      <CalculationLineage
        analysis={analysis}
        locked={locked}
        onRecalc={onRecalc}
        onPopOut={onPopOutLineage}
        popped={lineagePopped}
        onReturn={onReturnLineage}
      />
    </div>
  );
}
