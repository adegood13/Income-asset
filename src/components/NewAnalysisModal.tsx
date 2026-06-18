import { useState } from "react";
import { Banknote, PiggyBank, RefreshCw, UploadCloud, Loader2, FileCheck2 } from "lucide-react";
import type { DocType, ModuleKind } from "../types";
import { Modal } from "./Modal";
import { DocIcon } from "./DocIcon";
import { useApp } from "../state/AppContext";
import { navigate } from "../state/router";
import {
  ASSET_DOC_TYPES,
  DOC_TYPE_LABEL,
  INCOME_DOC_TYPES,
  extractDocument,
} from "../mock/extraction";
import { generateLoanNumber } from "../lib/id";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultModule?: ModuleKind;
}

type Phase = "configure" | "extracting";

export function NewAnalysisModal({ open, onClose, defaultModule = "income" }: Props) {
  const { createAnalysis } = useApp();
  const [module, setModule] = useState<ModuleKind>(defaultModule);
  const [loanNumber, setLoanNumber] = useState(generateLoanNumber());
  const [docType, setDocType] = useState<DocType | null>(null);
  const [phase, setPhase] = useState<Phase>("configure");

  const docTypes = module === "income" ? INCOME_DOC_TYPES : ASSET_DOC_TYPES;

  const reset = () => {
    setPhase("configure");
    setDocType(null);
    setModule(defaultModule);
    setLoanNumber(generateLoanNumber());
  };

  const close = () => {
    if (phase === "extracting") return;
    reset();
    onClose();
  };

  const switchModule = (m: ModuleKind) => {
    setModule(m);
    setDocType(null);
  };

  const handleCreate = async () => {
    if (!docType) return;
    setPhase("extracting");
    const doc = await extractDocument(docType); // MOCK extraction (~1s)
    const analysis = createAnalysis(module, loanNumber, doc);
    navigate(`/analysis/${analysis.id}`);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="New analysis"
      subtitle="Pick a module, assign a loan number, and upload the first document."
      width="max-w-xl"
      footer={
        phase === "configure" ? (
          <>
            <button className="btn-secondary" onClick={close}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleCreate} disabled={!docType}>
              <UploadCloud className="h-4 w-4" />
              Upload &amp; extract
            </button>
          </>
        ) : undefined
      }
    >
      {phase === "extracting" ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin-slow text-brand" />
            <FileCheck2 className="absolute inset-0 m-auto h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="font-semibold text-navy">Extracting {docType && DOC_TYPE_LABEL[docType]}…</p>
            <p className="mt-1 text-sm text-ink-500">Classifying document and capturing fields with confidence scores.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Module */}
          <div>
            <label className="eyebrow mb-2 block">Module</label>
            <div className="grid grid-cols-2 gap-3">
              <ModuleCard
                active={module === "income"}
                icon={<Banknote className="h-5 w-5" />}
                title="Income"
                desc="W-2s, paystubs, tax returns"
                onClick={() => switchModule("income")}
              />
              <ModuleCard
                active={module === "asset"}
                icon={<PiggyBank className="h-5 w-5" />}
                title="Asset"
                desc="Bank & investment statements"
                onClick={() => switchModule("asset")}
              />
            </div>
          </div>

          {/* Loan number */}
          <div>
            <label className="eyebrow mb-2 block">Loan number</label>
            <div className="flex gap-2">
              <input
                className="input font-mono"
                value={loanNumber}
                onChange={(e) => setLoanNumber(e.target.value)}
                placeholder="LN-2026-00000"
              />
              <button
                className="btn-secondary shrink-0 px-3"
                onClick={() => setLoanNumber(generateLoanNumber())}
                title="Auto-generate"
              >
                <RefreshCw className="h-4 w-4" />
                Auto
              </button>
            </div>
          </div>

          {/* Document drop zone */}
          <div>
            <label className="eyebrow mb-2 block">First document</label>
            <div className="rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-ink-500">
                <UploadCloud className="h-4 w-4" />
                Drop a file to upload — or pick a sample document to extract:
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {docTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setDocType(t)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition
                      ${docType === t ? "border-brand bg-brand-tint" : "border-ink-200 bg-surface hover:border-ink-300"}`}
                  >
                    <DocIcon type={t} className={`h-4 w-4 shrink-0 ${docType === t ? "text-brand" : "text-ink-500"}`} />
                    <span className="text-xs font-medium leading-tight text-ink-700">{DOC_TYPE_LABEL[t]}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink-400">
              Mock upload — loads a pre-baked sample document. You can add more documents inside the workspace.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ModuleCard({
  active,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition
        ${active ? "border-brand bg-brand-tint shadow-card" : "border-ink-200 bg-surface hover:border-ink-300"}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? "bg-brand-gradient text-white" : "bg-ink-100 text-ink-500"}`}>
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-navy">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-500">{desc}</span>
      </span>
    </button>
  );
}
