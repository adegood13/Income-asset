import { useMemo, useState } from "react";
import { Plus, Banknote, PiggyBank } from "lucide-react";
import type { ModuleKind } from "../types";
import { useApp } from "../state/AppContext";
import { AnalysisTable } from "../components/AnalysisTable";
import { NewAnalysisModal } from "../components/NewAnalysisModal";

const COPY: Record<ModuleKind, { title: string; desc: string }> = {
  income: {
    title: "Income Analysis",
    desc: "W-2s, paystubs, tax returns, and self-employment income.",
  },
  asset: {
    title: "Asset Analysis",
    desc: "Bank statements, investment and retirement accounts.",
  },
};

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

  const copy = COPY[module];
  const Icon = module === "income" ? Banknote : PiggyBank;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy">{copy.title}</h1>
            <p className="mt-0.5 text-sm text-ink-500">{copy.desc}</p>
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
