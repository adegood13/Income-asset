import { useEffect, useRef, useState } from "react";
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
  ExternalLink,
  Undo2,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { navigate } from "../state/router";
import { DocumentList } from "../components/DocumentList";
import { DataPointsPanel } from "../components/DataPointsPanel";
import { CalculationPanel } from "../components/CalculationPanel";
import { CalculationLineage } from "../components/CalculationLineage";
import { NotesDrawer } from "../components/NotesDrawer";
import { AddDocumentModal } from "../components/AddDocumentModal";
import { PopoutWindow } from "../components/PopoutWindow";
import { StatusChip } from "../components/StatusChip";
import { MaskedText } from "../components/MaskedValue";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { avgConfidence, overrideCount } from "../lib/analytics";
import { downloadAnalysisJSON, openPrintableWorksheet } from "../lib/export";
import { openDocumentView } from "../mock/documentViewer";
import { ConfidenceDot } from "../components/ConfidenceBadge";
import { useMediaQuery } from "../lib/useMediaQuery";

const COLS_KEY = "askbob.cols.v1";
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function loadCols(): { left: number; right: number } {
  try {
    const r = JSON.parse(localStorage.getItem(COLS_KEY) || "");
    return { left: clamp(r.left ?? 300, 220, 520), right: clamp(r.right ?? 400, 300, 620) };
  } catch {
    return { left: 300, right: 400 };
  }
}

type PanelKey = "docs" | "data" | "calc" | "lineage";

export function AnalysisWorkspace({ id }: { id: string }) {
  const { getAnalysis, reveal, can, setMethod, setGuideline, recalc, finalize, setStatus } = useApp();
  const toast = useToast();
  const analysis = getAnalysis(id);
  const wide = useMediaQuery("(min-width: 1280px)");

  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [popped, setPopped] = useState<Record<PanelKey, boolean>>({
    docs: false,
    data: false,
    calc: false,
    lineage: false,
  });

  // Resizable column widths (left + right; center flexes).
  const initial = loadCols();
  const [leftW, setLeftW] = useState(initial.left);
  const [rightW, setRightW] = useState(initial.right);
  const widthsRef = useRef({ left: leftW, right: rightW });
  widthsRef.current = { left: leftW, right: rightW };
  const drag = useRef<{ side: "left" | "right"; startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const delta = e.clientX - d.startX;
      if (d.side === "left") setLeftW(clamp(d.startW + delta, 220, 520));
      else setRightW(clamp(d.startW - delta, 300, 620));
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(COLS_KEY, JSON.stringify(widthsRef.current));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

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

  // Role gating: a role without analysis:edit gets a read-only workspace.
  const canEdit = can("analysis:edit");
  const readOnlyByRole = !canEdit && analysis.status !== "finalized";
  const locked = analysis.status === "finalized" || !canEdit;
  const selectedDoc =
    analysis.documents.find((d) => d.id === selectedDocId) ?? analysis.documents[0];
  const ov = overrideCount(analysis);

  const setPop = (key: PanelKey, v: boolean) => setPopped((p) => ({ ...p, [key]: v }));

  const handleSave = () => {
    if (analysis.status === "draft") setStatus(analysis.id, "in_review");
    toast("Analysis saved", "success");
  };

  const handleFinalize = () => {
    finalize(analysis.id);
    setFinalizeOpen(false);
    toast(`${analysis.loanNumber} finalized and locked`, "success");
  };

  const startDrag = (side: "left" | "right") => (e: React.PointerEvent) => {
    e.preventDefault();
    drag.current = { side, startX: e.clientX, startW: side === "left" ? leftW : rightW };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Panel content. `inPopup` hides the pop-out control (the window has its own Return).
  const docsNode = (inPopup: boolean) => (
    <DocumentList
      documents={analysis.documents}
      selectedId={selectedDoc?.id ?? ""}
      onSelect={setSelectedDocId}
      onAdd={() => setAddDocOpen(true)}
      onView={(docId) => {
        const d = analysis.documents.find((x) => x.id === docId);
        if (d) openDocumentView(d, reveal);
      }}
      onPopOut={inPopup ? undefined : () => setPop("docs", true)}
      locked={locked}
    />
  );

  const dataNode = (inPopup: boolean) =>
    selectedDoc ? (
      <DataPointsPanel
        analysisId={analysis.id}
        doc={selectedDoc}
        locked={locked}
        onView={() => openDocumentView(selectedDoc, reveal)}
        onPopOut={inPopup ? undefined : () => setPop("data", true)}
        bankIncome={analysis.module === "income" && selectedDoc.docType === "BankStatement"}
      />
    ) : (
      <p className="py-10 text-center text-sm text-ink-400">No documents attached.</p>
    );

  const calcNode = (inPopup: boolean) => (
    <CalculationPanel
      analysis={analysis}
      locked={locked}
      onMethodChange={(m) => setMethod(analysis.id, m)}
      onGuidelineChange={(g) => setGuideline(analysis.id, g)}
      onRecalc={() => {
        recalc(analysis.id);
        toast("Recalculated", "info");
      }}
      onPopOut={inPopup ? undefined : () => setPop("calc", true)}
      onPopOutLineage={inPopup ? undefined : () => setPop("lineage", true)}
      lineagePopped={inPopup ? false : popped.lineage}
      onReturnLineage={() => setPop("lineage", false)}
    />
  );

  const cols = wide
    ? `${leftW}px 7px minmax(0,1fr) 7px ${rightW}px`
    : "1fr";

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
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-dark text-white">
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
                {readOnlyByRole && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs font-semibold text-ink-500">
                    <Lock className="h-3 w-3" /> Read-only
                  </span>
                )}
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
                    <span className="text-[#9A6300] dark:text-[#E7B264]">{ov} override{ov === 1 ? "" : "s"}</span>
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
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-surface py-1 shadow-float animate-scale-in">
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

            {analysis.status === "finalized" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-4 py-2.5 text-sm font-semibold text-green-deep">
                <Lock className="h-4 w-4" />
                Finalized
              </span>
            ) : (
              can("analysis:finalize") && (
                <button className="btn-primary" onClick={() => setFinalizeOpen(true)}>
                  <Lock className="h-4 w-4" />
                  Finalize
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Three-column workspace — resizable (drag the dividers); panels pop out */}
      <div className="grid min-h-0 flex-1 gap-4 xl:gap-0" style={{ gridTemplateColumns: cols }}>
        {/* Documents */}
        <aside className="min-w-0 scroll-thin xl:h-full xl:overflow-y-auto xl:pr-1">
          {popped.docs ? (
            <PoppedPlaceholder title="Documents" onReturn={() => setPop("docs", false)} />
          ) : (
            docsNode(false)
          )}
        </aside>

        {wide && <ResizeHandle onPointerDown={startDrag("left")} />}

        {/* Data points */}
        <section className={popped.data ? "min-h-0 xl:h-full" : "card min-h-0 p-4 xl:h-full"}>
          {popped.data ? (
            <PoppedPlaceholder title="Data points" onReturn={() => setPop("data", false)} />
          ) : (
            dataNode(false)
          )}
        </section>

        {wide && <ResizeHandle onPointerDown={startDrag("right")} />}

        {/* Calculation */}
        <aside className="min-w-0 scroll-thin xl:h-full xl:overflow-y-auto xl:pr-1">
          {popped.calc ? (
            <PoppedPlaceholder title="Calculation" onReturn={() => setPop("calc", false)} />
          ) : (
            calcNode(false)
          )}
        </aside>
      </div>

      {/* Popped-out windows (portaled; share live app state) */}
      {popped.docs && (
        <PopoutWindow
          title="Documents"
          width={360}
          height={820}
          onClose={() => setPop("docs", false)}
          onReturn={() => setPop("docs", false)}
        >
          <div className="h-full overflow-auto scroll-thin">{docsNode(true)}</div>
        </PopoutWindow>
      )}
      {popped.data && (
        <PopoutWindow
          title="Data points"
          width={580}
          onClose={() => setPop("data", false)}
          onReturn={() => setPop("data", false)}
        >
          <div className="card h-full p-4">{dataNode(true)}</div>
        </PopoutWindow>
      )}
      {popped.calc && (
        <PopoutWindow
          title="Calculation"
          width={460}
          onClose={() => setPop("calc", false)}
          onReturn={() => setPop("calc", false)}
        >
          <div className="h-full overflow-auto scroll-thin">{calcNode(true)}</div>
        </PopoutWindow>
      )}
      {popped.lineage && (
        <PopoutWindow
          title="Calculation lineage"
          width={460}
          onClose={() => setPop("lineage", false)}
          onReturn={() => setPop("lineage", false)}
        >
          <div className="flex h-full flex-col">
            <CalculationLineage
              analysis={analysis}
              locked={locked}
              onRecalc={() => {
                recalc(analysis.id);
                toast("Recalculated", "info");
              }}
            />
          </div>
        </PopoutWindow>
      )}

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
        <div className="flex items-start gap-3 rounded-xl border border-[#F5A623]/30 bg-[#FFF6E5] p-4 dark:bg-[#2A2412]">
          <ShieldAlert className="h-5 w-5 shrink-0 text-[#9A6300] dark:text-[#E7B264]" />
          <div className="text-sm text-ink-700">
            <p className="font-semibold text-[#9A6300] dark:text-[#E7B264]">Fields will become read-only.</p>
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

function ResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      className="group flex cursor-col-resize items-center justify-center"
      title="Drag to resize"
    >
      <div className="h-10 w-1 rounded-full bg-ink-200 transition group-hover:bg-brand" />
    </div>
  );
}

function PoppedPlaceholder({ title, onReturn }: { title: string; onReturn: () => void }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-brand shadow-card">
        <ExternalLink className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-navy">{title} popped out</p>
        <p className="mt-1 text-xs text-ink-500">Open in a separate window for side-by-side comparison.</p>
      </div>
      <button className="btn-secondary px-3 py-1.5 text-xs" onClick={onReturn}>
        <Undo2 className="h-3.5 w-3.5" />
        Return here
      </button>
    </div>
  );
}
