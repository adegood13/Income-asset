import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ModuleKind } from "../types";
import { useApp } from "../state/AppContext";
import { AnalysisTable } from "../components/AnalysisTable";
import { NewAnalysisModal } from "../components/NewAnalysisModal";
import { MODULE_LABEL, MODULE_DESC, MODULE_ICON } from "../lib/modules";
import { PageHero } from "../components/PageHero";

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
      <PageHero
        eyebrow="Analysis"
        icon={Icon}
        title={`${MODULE_LABEL[module]} Analysis`}
        subtitle={MODULE_DESC[module]}
        actions={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New {module} analysis
          </button>
        }
      />

      <div className="mt-6">
        <AnalysisTable analyses={filtered} />
      </div>

      <NewAnalysisModal open={modalOpen} onClose={() => setModalOpen(false)} defaultModule={module} />
    </div>
  );
}
