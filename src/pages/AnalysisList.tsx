import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ModuleKind } from "../types";
import { useApp } from "../state/AppContext";
import { AnalysisTable } from "../components/AnalysisTable";
import { NewAnalysisModal } from "../components/NewAnalysisModal";
import { MODULE_LABEL, MODULE_DESC, MODULE_ICON } from "../lib/modules";

export function AnalysisList({ module }: { module: ModuleKind }) {
  const { analyses } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(
    () =>
      analyses
        .filter((a) => a.module === module)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [analyses, module],
  );

  const Icon = MODULE_ICON[module];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-dark text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy">{MODULE_LABEL[module]} Analysis</h1>
            <p className="mt-0.5 text-sm text-ink-500">{MODULE_DESC[module]}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New {module} analysis
        </button>
      </div>

      <div className="mt-6">
        <AnalysisTable analyses={filtered} />
      </div>

      <NewAnalysisModal open={modalOpen} onClose={() => setModalOpen(false)} defaultModule={module} />
    </div>
  );
}
