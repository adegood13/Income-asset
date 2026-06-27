import { useMemo, useState } from "react";
import { Plus, FolderOpen, ClipboardCheck, CheckCircle2, Search, Download, X } from "lucide-react";
import { useApp } from "../state/AppContext";
import { AnalysisTable } from "../components/AnalysisTable";
import { NewAnalysisModal } from "../components/NewAnalysisModal";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { STATUS_LABEL } from "../components/StatusChip";
import { useToast } from "../components/Toast";
import {
  countByStatus,
  fleetAvgConfidence,
  finalizedThisWeek,
  avgConfidence,
  overrideCount,
} from "../lib/analytics";
import { downloadCSV } from "../lib/export";
import { maskIdentifier } from "../mock/tokenization";
import { formatDateTime } from "../lib/format";
import { MODULE_LABEL } from "../lib/modules";
import { PageHero, HeroAccent } from "../components/PageHero";

export function Dashboard() {
  const { analyses, reveal } = useApp();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const byStatus = countByStatus(analyses);
    return {
      open: byStatus.draft + byStatus.in_review + byStatus.calculated,
      awaiting: byStatus.in_review,
      finalized: finalizedThisWeek(analyses),
      avg: fleetAvgConfidence(analyses),
    };
  }, [analyses]);

  // Search by loan number or borrower name (matches the real value even when
  // PII is masked on screen), then sort by most-recently updated.
  const recent = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...analyses]
      .filter(
        (a) =>
          !q ||
          a.loanNumber.toLowerCase().includes(q) ||
          a.borrowerName.toLowerCase().includes(q),
      )
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [analyses, query]);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Loan number", "Borrower", "Module", "Status", "Avg confidence", "Overrides", "Updated"],
      ...recent.map((a) => [
        a.loanNumber,
        reveal ? a.borrowerName : maskIdentifier("name", a.borrowerName),
        MODULE_LABEL[a.module],
        STATUS_LABEL[a.status],
        avgConfidence(a),
        overrideCount(a),
        formatDateTime(a.updatedAt),
      ]),
    ];
    downloadCSV(`askbob-analyses-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast(`Exported ${recent.length} ${recent.length === 1 ? "analysis" : "analyses"} to CSV`, "success");
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHero
        eyebrow="Workspace"
        title="Dashboard"
        subtitle={
          <>
            Every income, asset, and DSCR analysis, <HeroAccent>clearly</HeroAccent> answered.
          </>
        }
        actions={
          <>
            <button className="btn-on-color" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New analysis
            </button>
          </>
        }
      />

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy">
            {query ? "Search results" : "Recent analyses"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search loan # or borrower…"
                aria-label="Search analyses by loan number or borrower name"
                className="input w-64 max-w-[70vw] pl-9 pr-8"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:text-ink-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <span className="hidden text-sm text-ink-400 sm:inline">
              {recent.length} of {analyses.length}
            </span>
          </div>
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
    amber: "bg-[#FFF4E0] text-[#9A6300] dark:bg-[#2A2412] dark:text-[#E7B264]",
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
