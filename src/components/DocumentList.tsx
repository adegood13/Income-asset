import { Plus } from "lucide-react";
import type { DocumentRecord } from "../types";
import { DocIcon } from "./DocIcon";
import { ConfidenceDot } from "./ConfidenceBadge";
import { DOC_TYPE_LABEL } from "../mock/extraction";

interface Props {
  documents: DocumentRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  locked: boolean;
}

export function DocumentList({ documents, selectedId, onSelect, onAdd, locked }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="eyebrow">Documents · {documents.length}</span>
      </div>
      <div className="space-y-2">
        {documents.map((d) => {
          const active = d.id === selectedId;
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition
                ${active ? "border-brand bg-brand-tint shadow-card" : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50"}`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  active ? "bg-white text-brand" : "bg-ink-100 text-ink-500"
                }`}
              >
                <DocIcon type={d.docType} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy">
                  {DOC_TYPE_LABEL[d.docType]}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-500">{d.periodLabel}</span>
                <span className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Doc conf.</span>
                  <ConfidenceDot value={d.overallConfidence} />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        disabled={locked}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 px-3 py-3 text-sm font-medium text-ink-500 transition hover:border-brand hover:bg-brand-tint hover:text-brand disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add document
      </button>
    </div>
  );
}
