import { useMemo, useState } from "react";
import { Plus, FolderOpen, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { useApp } from "../state/AppContext";
import { AnalysisTable } from "../components/AnalysisTable";
import { NewAnalysisModal } from "../components/NewAnalysisModal";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import {
  countByStatus,
  fleetAvgConfidence,
  finalizedThisWeek,
} from "../lib/analytics";

export function Dashboard() {
  const { analyses } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const stats = useMemo(() => {
    const byStatus = countByStatus(analyses);
    return {
      open: byStatus.draft + byStatus.in_review + byStatus.calculated,
      awaiting: byStatus.in_review,
      finalized: finalizedThisWeek(analyses),
      avg: fleetAvgConfidence(analyses),
    };
  }, [analyses]);

  const recent = useMemo(
    () => [...analyses].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [analyses],
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-600">
            Every income and asset analysis, <span className="serif-accent text-brand">clearly</span> answered.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New analysis
        </button>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FolderOpen className="h-5 w-5" />}
          label="Open analyses"
          value={stats.open}
          accent="brand"
        />
        <StatCard
          icon={<ClipboardCheck className="h-5 w-5" />}
          label="Awaiting review"
          value={stats.awaiting}
          accent="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Finalized this week"
          value={stats.finalized}
          accent="green"
        />
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-ink-500">Average confidence</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-navy">{stats.avg}</p>
            <p className="mt-1 text-xs text-ink-400">across all captured fields</p>
          </div>
          <ConfidenceBadge value={stats.avg} size="md" />
        </div>
      </div>

      {/* Recent analyses */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Recent analyses</h2>
          <span className="text-sm text-ink-400">{analyses.length} total</span>
        </div>
        <AnalysisTable analyses={recent} />
      </div>

      <NewAnalysisModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "brand" | "amber" | "green";
}) {
  const accents = {
    brand: "bg-brand-tint text-brand",
    amber: "bg-[#FFF4E0] text-[#9A6300]",
    green: "bg-green-tint text-green-deep",
  };
  return (
    <div className="card flex items-center justify-between p-5">
      <div>
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <p className="mt-1 font-mono text-3xl font-semibold text-navy">{value}</p>
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accents[accent]}`}>
        {icon}
      </span>
    </div>
  );
}
