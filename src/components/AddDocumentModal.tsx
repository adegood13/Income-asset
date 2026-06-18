import { useState } from "react";
import { UploadCloud, Loader2, FileCheck2 } from "lucide-react";
import type { DocType, ModuleKind } from "../types";
import { Modal } from "./Modal";
import { DocIcon } from "./DocIcon";
import { useApp } from "../state/AppContext";
import {
  ASSET_DOC_TYPES,
  DOC_TYPE_LABEL,
  INCOME_DOC_TYPES,
  extractDocument,
} from "../mock/extraction";

interface Props {
  open: boolean;
  onClose: () => void;
  analysisId: string;
  module: ModuleKind;
}

export function AddDocumentModal({ open, onClose, analysisId, module }: Props) {
  const { addDocument } = useApp();
  const [docType, setDocType] = useState<DocType | null>(null);
  const [extracting, setExtracting] = useState(false);

  const docTypes = module === "income" ? INCOME_DOC_TYPES : ASSET_DOC_TYPES;

  const close = () => {
    if (extracting) return;
    setDocType(null);
    onClose();
  };

  const handleAdd = async () => {
    if (!docType) return;
    setExtracting(true);
    const doc = await extractDocument(docType); // MOCK extraction
    addDocument(analysisId, doc);
    setExtracting(false);
    setDocType(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add document"
      subtitle="Upload another document to this analysis."
      footer={
        !extracting ? (
          <>
            <button className="btn-secondary" onClick={close}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAdd} disabled={!docType}>
              <UploadCloud className="h-4 w-4" />
              Upload &amp; extract
            </button>
          </>
        ) : undefined
      }
    >
      {extracting ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin-slow text-brand" />
            <FileCheck2 className="absolute inset-0 m-auto h-5 w-5 text-brand" />
          </div>
          <p className="font-semibold text-navy">Extracting {docType && DOC_TYPE_LABEL[docType]}…</p>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-ink-500">
            <UploadCloud className="h-4 w-4" />
            Pick a sample document to extract:
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {docTypes.map((t) => (
              <button
                key={t}
                onClick={() => setDocType(t)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition
                  ${docType === t ? "border-brand bg-brand-tint" : "border-ink-200 bg-white hover:border-ink-300"}`}
              >
                <DocIcon type={t} className={`h-4 w-4 shrink-0 ${docType === t ? "text-brand" : "text-ink-500"}`} />
                <span className="text-xs font-medium leading-tight text-ink-700">{DOC_TYPE_LABEL[t]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
