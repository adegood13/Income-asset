import { useEffect, useRef, useState } from "react";
import { EyeOff, MessageSquarePlus, MessageSquareText, RotateCcw, PenLine, FileSearch, Lock } from "lucide-react";
import type { CapturedField } from "../types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { useApp } from "../state/AppContext";
import { maskIdentifier } from "../mock/tokenization";
import { asNumber, formatMoney } from "../lib/format";

interface Props {
  analysisId: string;
  docId: string;
  field: CapturedField;
  locked: boolean;
  onLocate?: (fieldId: string) => void;
}

export function FieldRow({ analysisId, docId, field, locked, onLocate }: Props) {
  const { reveal, updateField, resetField, confidenceLockThreshold } = useApp();
  const [draft, setDraft] = useState(String(field.value));
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(field.note ?? "");
  const focused = useRef(false);

  // Keep the input in sync when the value changes externally (reset, etc.).
  useEffect(() => {
    if (!focused.current) setDraft(String(field.value));
  }, [field.value]);

  const isIdentifier = field.type === "identifier";
  const isFinancial = field.type === "financial";
  const masked = isIdentifier && !reveal;
  // Admin policy: lock high-confidence fields from editing.
  const policyLocked = confidenceLockThreshold != null && field.confidence >= confidenceLockThreshold;
  const valueLocked = locked || policyLocked;

  const commit = () => {
    const raw = draft.trim();
    const value: string | number = isFinancial ? asNumber(raw) : raw;
    if (String(value) !== String(field.value)) {
      updateField(analysisId, docId, field.id, { value });
    }
  };

  const commitNote = () => {
    updateField(analysisId, docId, field.id, { note: noteDraft.trim() || undefined });
    setEditingNote(false);
  };

  return (
    <div
      className={`group rounded-lg border px-3 py-2.5 transition
        ${field.overridden ? "border-[#F5A623]/40 bg-[#FFFBF2] dark:bg-[#211D12]" : "border-transparent hover:border-ink-200 hover:bg-ink-50"}`}
    >
      {/* Primary row — label, value, and confidence aligned on one centered line */}
      <div className="flex items-center gap-3">
        {/* Label + status chips */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-ink-700">{field.label}</span>
          {field.overridden && (
            <span className="inline-flex items-center gap-1 rounded bg-[#FFF4E0] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9A6300] dark:bg-[#2A2412] dark:text-[#E7B264]">
              <PenLine className="h-2.5 w-2.5" /> Overridden
            </span>
          )}
          {policyLocked && (
            <span
              className="inline-flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500"
              title={`Locked by admin policy — confidence ≥ ${confidenceLockThreshold}%`}
            >
              <Lock className="h-2.5 w-2.5" /> Locked
            </span>
          )}
        </div>

        {/* Value control */}
        <div className="w-[40%] shrink-0">
          {masked ? (
            <div className="flex h-9 items-center justify-between gap-2 rounded-xl border border-dashed border-ink-300 bg-ink-50 px-3">
              <span className="font-mono text-sm text-ink-500">{maskIdentifier(field.label, String(field.value))}</span>
              <span title="Reveal PII to view & edit">
                <EyeOff className="h-3.5 w-3.5 text-ink-400" />
              </span>
            </div>
          ) : (
            <div className="relative">
              {isFinancial && (
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-400">
                  $
                </span>
              )}
              <input
                className={`input font-mono disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400 ${
                  isFinancial ? "pl-6 text-right" : ""
                } ${field.overridden ? "border-[#F5A623]/50" : ""}`}
                value={draft}
                inputMode={isFinancial ? "decimal" : "text"}
                disabled={valueLocked}
                onFocus={() => (focused.current = true)}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  focused.current = false;
                  commit();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") {
                    setDraft(String(field.value));
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Confidence + note */}
        <div className="flex w-[68px] shrink-0 items-center justify-end gap-1">
          <ConfidenceBadge value={field.confidence} />
          <button
            onClick={() => setEditingNote((v) => !v)}
            className={`rounded-md p-1.5 transition ${
              field.note ? "text-brand hover:bg-brand-tint" : "text-ink-400 opacity-0 hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
            }`}
            title={field.note ? "Edit note" : "Add note"}
            aria-label="Field note"
          >
            {field.note ? <MessageSquareText className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Secondary row — source deep-link + reset, aligned under the label */}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {onLocate ? (
          <button
            onClick={() => onLocate(field.id)}
            title={`Open source document at: ${field.provenance}`}
            className="inline-flex min-w-0 items-center gap-1 text-[11px] text-ink-400 transition hover:text-brand"
          >
            <FileSearch className="h-3 w-3 shrink-0" />
            <span className="truncate hover:underline">{field.provenance}</span>
          </button>
        ) : (
          <span className="truncate text-[11px] text-ink-400" title={field.provenance}>
            {field.provenance}
          </span>
        )}
        {field.overridden && (
          <button
            onClick={() => resetField(analysisId, docId, field.id)}
            disabled={valueLocked}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-500 hover:text-ink-800 disabled:opacity-50"
            title="Restore captured value"
          >
            <RotateCcw className="h-3 w-3" />
            was&nbsp;
            <span className="font-mono">
              {isFinancial ? formatMoney(asNumber(field.originalValue), { cents: true }) : String(field.originalValue)}
            </span>
          </button>
        )}
      </div>

      {/* Per-field note editor */}
      {editingNote && (
        <div className="mt-2 rounded-lg border border-ink-200 bg-surface p-2.5 animate-fade-in">
          <textarea
            className="input min-h-[60px] resize-y text-sm"
            placeholder="Add a note about this field…"
            value={noteDraft}
            disabled={locked}
            onChange={(e) => setNoteDraft(e.target.value)}
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setEditingNote(false)}>
              Cancel
            </button>
            <button className="btn-primary px-3 py-1.5 text-xs" onClick={commitNote} disabled={locked}>
              Save note
            </button>
          </div>
        </div>
      )}
      {!editingNote && field.note && (
        <div className="mt-1.5 rounded-md bg-brand-tint/60 px-3 py-1.5 text-xs text-ink-600">
          <span className="font-semibold text-brand">Note:</span> {field.note}
        </div>
      )}
    </div>
  );
}
