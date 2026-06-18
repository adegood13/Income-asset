import { useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Save,
  Lock,
  Download,
  FileJson,
  Printer,
  ChevronDown,
  ShieldAlert,
  Banknote,
  PiggyBank,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { navigate } from "../state/router";
import { DocumentList } from "../components/DocumentList";
import { DataPointsPanel } from "../components/DataPointsPanel";
import { CalculationPanel } from "../components/CalculationPanel";
import { NotesDrawer } from "../components/NotesDrawer";
import { AddDocumentModal } from "../components/AddDocumentModal";
import { StatusChip } from "../components/StatusChip";
import { MaskedText } from "../components/MaskedValue";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { avgConfidence, overrideCount } from "../lib/analytics";
import { downloadAnalysisJSON, openPrintableWorksheet } from "../lib/export";
import { ConfidenceDot } from "../components/ConfidenceBadge";

export function AnalysisWorkspace({ id }: { id: string }) {
  const { getAnalysis, reveal, setMethod, recalc, finalize, setStatus } = useApp();
  const toast = useToast();
  const analysis = getAnalysis(id);

  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  if (!analysis) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-xl font-bold text-navy">Analysis not found</h1>
        <p className="mt-2 text-sm text-ink-500">It may have been removed or the link is stale.</p>
        <button className="btn-primary mx-auto mt-5" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
      </div>
    );
  }

  const locked = analysis.status === "finalized";
  const selectedDoc =
    analysis.documents.find((d) => d.id === selectedDocId) ?? analysis.documents[0];
  const ov = overrideCount(analysis);

  const handleSave = () => {
    if (analysis.status === "draft") setStatus(analysis.id, "in_review");
    toast("Analysis saved", "success");
  };

  const handleFinalize = () => {
    finalize(analysis.id);
    setFinalizeOpen(false);
    toast(`${analysis.loanNumber} finalized and locked`, "success");
  };

  return (
    <div className="flex flex-col px-4 py-4 sm:px-6 lg:px-8 xl:h-[calc(100vh-4rem)]">
      {/* Workspace header */}
      <div className="shrink-0 pb-4">
        <button
          onClick={() => navigate(analysis.module === "income" ? "/income" : "/asset")}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {analysis.module === "income" ? "Income Analysis" : "Asset Analysis"}
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
              {analysis.module === "income" ? (
                <Banknote className="h-6 w-6" />
              ) : (
                <PiggyBank className="h-6 w-6" />
              )}
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-xl font-semibold text-navy">{analysis.loanNumber}</h1>
                <StatusChip status={analysis.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                <MaskedText label="borrower name" value={analysis.borrowerName} className="font-medium text-ink-600" />
                <span className="text-ink-300">·</span>
                <span className="inline-flex items-center gap-1.5">
                  avg <ConfidenceDot value={avgConfidence(analysis)} />
                </span>
                {ov > 0 && (
                  <>
                    <span className="text-ink-300">·</span>
                    <span className="text-[#9A6300]">{ov} override{ov === 1 ? "" : "s"}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" onClick={() => setNotesOpen(true)}>
              <MessageSquare className="h-4 w-4" />
              Notes
              {analysis.notes.length > 0 && (
                <span className="ml-0.5 rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                  {analysis.notes.length}
                </span>
              )}
            </button>

            {/* Export dropdown */}
            <div className="relative">
              <button className="btn-secondary" onClick={() => setExportOpen((v) => !v)}>
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-float animate-scale-in">
                    <button
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
                      onClick={() => {
                        openPrintableWorksheet(analysis, reveal);
                        setExportOpen(false);
                      }}
                    >
                      <Printer className="h-4 w-4 text-ink-400" />
                      Printable worksheet
                    </button>
                    <button
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
                      onClick={() => {
                        downloadAnalysisJSON(analysis);
                        setExportOpen(false);
                        toast("Worksheet JSON downloaded", "success");
                      }}
                    >
                      <FileJson className="h-4 w-4 text-ink-400" />
                      Download JSON
                    </button>
                  </div>
                </>
              )}
            </div>

            <button className="btn-secondary" onClick={handleSave} disabled={locked}>
              <Save className="h-4 w-4" />
              Save
            </button>

            {locked ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-green/30 bg-green-tint px-4 py-2.5 text-sm font-semibold text-green-deep">
                <Lock className="h-4 w-4" />
                Finalized
              </span>
            ) : (
              <button className="btn-primary" onClick={() => setFinalizeOpen(true)}>
                <Lock className="h-4 w-4" />
                Finalize
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Three-column workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[290px_minmax(0,1fr)_400px]">
        <aside className="scroll-thin xl:overflow-y-auto xl:pr-1">
          <DocumentList
            documents={analysis.documents}
            selectedId={selectedDoc?.id ?? ""}
            onSelect={setSelectedDocId}
            onAdd={() => setAddDocOpen(true)}
            locked={locked}
          />
        </aside>

        <section className="card min-h-0 p-4 xl:h-full">
          {selectedDoc ? (
            <DataPointsPanel analysisId={analysis.id} doc={selectedDoc} locked={locked} />
          ) : (
            <p className="py-10 text-center text-sm text-ink-400">No documents attached.</p>
          )}
        </section>

        <aside className="min-h-0 scroll-thin xl:h-full xl:overflow-y-auto xl:pr-1">
          <CalculationPanel
            analysis={analysis}
            locked={locked}
            onMethodChange={(m) => setMethod(analysis.id, m)}
            onRecalc={() => {
              recalc(analysis.id);
              toast("Recalculated", "info");
            }}
          />
        </aside>
      </div>

      {/* Overlays */}
      <NotesDrawer analysis={analysis} open={notesOpen} onClose={() => setNotesOpen(false)} />
      <AddDocumentModal
        open={addDocOpen}
        onClose={() => setAddDocOpen(false)}
        analysisId={analysis.id}
        module={analysis.module}
      />
      <Modal
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        title="Finalize analysis?"
        subtitle="This locks the analysis and flips its status to Finalized."
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFinalizeOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleFinalize}>
              <Lock className="h-4 w-4" />
              Finalize &amp; lock
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-[#F5A623]/30 bg-[#FFF4E0] p-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-[#9A6300]" />
          <div className="text-sm text-ink-700">
            <p className="font-semibold text-[#9A6300]">Fields will become read-only.</p>
            <p className="mt-1">
              The calculation lineage and captured values are frozen. Notes remain append-only.
              In production this would write a signed, immutable record to the audit store.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
