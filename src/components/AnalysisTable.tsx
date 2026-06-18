import { ArrowUpRight, PenLine } from "lucide-react";
import type { Analysis } from "../types";
import { StatusChip } from "./StatusChip";
import { ConfidenceDot } from "./ConfidenceBadge";
import { MaskedText } from "./MaskedValue";
import { navigate } from "../state/router";
import { avgConfidence, overrideCount } from "../lib/analytics";
import { relativeTime } from "../lib/format";
import { MODULE_LABEL, MODULE_ICON } from "../lib/modules";

export function AnalysisTable({ analyses }: { analyses: Analysis[] }) {
  if (analyses.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-medium text-ink-600">No analyses yet</p>
        <p className="text-sm text-ink-400">Create a new analysis to get started.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 text-left">
              <Th>Loan number</Th>
              <Th>Borrower</Th>
              <Th>Module</Th>
              <Th>Status</Th>
              <Th>Avg confidence</Th>
              <Th>Overrides</Th>
              <Th>Updated</Th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {analyses.map((a) => {
              const ov = overrideCount(a);
              return (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/analysis/${a.id}`)}
                  className="group cursor-pointer border-b border-ink-100 transition last:border-0 hover:bg-brand-tint/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-navy">{a.loanNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <MaskedText label="borrower name" value={a.borrowerName} className="font-medium text-ink-700" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-ink-600">
                      {(() => {
                        const Icon = MODULE_ICON[a.module];
                        return <Icon className="h-4 w-4 text-ink-400" />;
                      })()}
                      {MODULE_LABEL[a.module]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceDot value={avgConfidence(a)} />
                  </td>
                  <td className="px-4 py-3">
                    {ov > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6300]">
                        <PenLine className="h-3 w-3" /> {ov}
                      </span>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{relativeTime(a.updatedAt)}</td>
                  <td className="px-2 py-3">
                    <ArrowUpRight className="h-4 w-4 text-ink-300 transition group-hover:text-brand" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
      {children}
    </th>
  );
}
