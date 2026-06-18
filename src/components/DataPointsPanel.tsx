import { Sparkles, FileSearch, ExternalLink, Plus } from "lucide-react";
import type { DocumentRecord } from "../types";
import { FieldRow } from "./FieldRow";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { DOC_TYPE_LABEL } from "../mock/extraction";
import { openDocumentView } from "../mock/documentViewer";
import { useApp } from "../state/AppContext";
import { asNumber, formatMoney } from "../lib/format";
import { DocIcon } from "./DocIcon";

interface Props {
  analysisId: string;
  doc: DocumentRecord;
  locked: boolean;
  onView?: () => void;
  onPopOut?: () => void;
  // Bank-statement income: allow include/exclude + manual deposit line items.
  bankIncome?: boolean;
}

// Stable group ordering across both modules.
const GROUP_ORDER = ["Identifiers", "Income lines", "Add-backs", "Balances", "Deposits"];

function groupFields(doc: DocumentRecord) {
  const groups = new Map<string, typeof doc.fields>();
  for (const f of doc.fields) {
    const key = f.group ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }
  return Array.from(groups.entries()).sort(
    (a, b) => {
      const ai = GROUP_ORDER.indexOf(a[0]);
      const bi = GROUP_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    },
  );
}

export function DataPointsPanel({ analysisId, doc, locked, onView, onPopOut, bankIncome }: Props) {
  const { reveal, addManualField } = useApp();
  const groups = groupFields(doc);
  const lowCount = doc.fields.filter((f) => f.confidence < 70).length;
  // Eligible monthly deposits for this statement (bank-statement income).
  const eligibleDeposits = doc.fields
    .filter((f) => f.group === "Deposits" && !f.excluded)
    .reduce((s, f) => s + asNumber(f.value), 0);

  return (
    <div className="flex h-full flex-col">
      {/* Document header */}
      <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-1 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-dark text-white">
            <DocIcon type={doc.docType} className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-navy">{DOC_TYPE_LABEL[doc.docType]}</h2>
            <p className="text-xs text-ink-500">{doc.periodLabel} · captured by extraction</p>
            {onView && (
              <button
                onClick={onView}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition hover:text-brand-deep hover:underline"
                title="View the source document used for this calculation"
              >
                <FileSearch className="h-3.5 w-3.5" />
                View source document
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onPopOut && (
            <button
              onClick={onPopOut}
              className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              title="Pop out into a separate window"
              aria-label="Pop out data points panel"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
          <ConfidenceBadge value={doc.overallConfidence} size="md" />
        </div>
      </div>

      {/* Assist-mode helper line */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-tint px-3 py-2 text-xs text-ink-600">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand" />
        <span>
          Assist mode — every value below is editable.{" "}
          {lowCount > 0 ? (
            <span className="font-semibold text-danger">{lowCount} low-confidence field{lowCount === 1 ? "" : "s"} need a look.</span>
          ) : (
            <span className="font-semibold text-green-deep">No low-confidence fields.</span>
          )}
        </span>
      </div>

      {/* Bank-statement income: this month's eligible-deposit total */}
      {bankIncome && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-green/20 bg-green-tint px-3 py-2 text-xs">
          <span className="font-medium text-ink-600">Eligible deposits this statement</span>
          <span className="font-mono font-semibold text-green-deep">{formatMoney(eligibleDeposits, { cents: true })}</span>
        </div>
      )}

      {/* Grouped fields */}
      <div className="mt-2 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 scroll-thin">
        {groups.map(([group, fields]) => (
          <div key={group}>
            <div className="mb-2 flex items-center gap-2">
              <span className="eyebrow">{group}</span>
              <span className="h-px flex-1 bg-ink-200" />
            </div>
            <div className="space-y-1">
              {fields.map((field) => (
                <FieldRow
                  key={field.id}
                  analysisId={analysisId}
                  docId={doc.id}
                  field={field}
                  locked={locked}
                  onLocate={(fid) => openDocumentView(doc, reveal, fid)}
                  allowExclude={bankIncome && field.group === "Deposits"}
                />
              ))}
            </div>
            {bankIncome && group === "Deposits" && !locked && (
              <button
                onClick={() => addManualField(analysisId, doc.id, "Deposits")}
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-xs font-medium text-ink-500 transition hover:border-brand hover:bg-brand-tint hover:text-brand"
              >
                <Plus className="h-3.5 w-3.5" /> Add deposit line item
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
