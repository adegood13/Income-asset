import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Calendar } from "lucide-react";
import { useApp } from "../state/AppContext";
import { useToast } from "../components/Toast";
import { countByStatus, fleetAvgConfidence } from "../lib/analytics";
import {
  DATE_RANGES,
  confidenceBuckets,
  filterByRange,
  overrideRateSeries,
  turnTimeByModule,
} from "../lib/reports";
import { STATUS_LABEL } from "../components/StatusChip";
import { downloadCSV } from "../lib/export";
import { CONFIDENCE_HEX } from "../lib/confidence";

const STATUS_FILL: Record<string, string> = {
  draft: "#B5B8BF",
  in_review: "#1281DE",
  calculated: "#F5A623",
  finalized: "#19D467",
};

export function Reports() {
  const { analyses } = useApp();
  const toast = useToast();
  const [rangeId, setRangeId] = useState("90d");

  const range = DATE_RANGES.find((r) => r.id === rangeId) ?? DATE_RANGES[2];
  const filtered = useMemo(() => filterByRange(analyses, range.days), [analyses, range.days]);

  const statusData = useMemo(() => {
    const c = countByStatus(filtered);
    return (Object.keys(c) as (keyof typeof c)[]).map((k) => ({
      status: k,
      label: STATUS_LABEL[k],
      count: c[k],
    }));
  }, [filtered]);

  const confData = useMemo(() => confidenceBuckets(filtered), [filtered]);
  const overrideData = useMemo(() => overrideRateSeries(range.days), [range.days]);
  const turnData = useMemo(() => turnTimeByModule(filtered), [filtered]);
  const avgConf = useMemo(() => fleetAvgConfidence(filtered), [filtered]);

  const exportReport = () => {
    const rows: (string | number)[][] = [
      ["AskBobAI Report", range.label],
      [],
      ["Volume by status"],
      ["Status", "Count"],
      ...statusData.map((d) => [d.label, d.count]),
      [],
      ["Confidence distribution"],
      ["Range", "Field count"],
      ...confData.map((d) => [d.range, d.count]),
      [],
      ["Override rate over time"],
      ["Week", "Override rate %"],
      ...overrideData.map((d) => [d.week, d.rate]),
      [],
      ["Average turn time by module"],
      ["Module", "Hours"],
      ...turnData.map((d) => [d.module, d.hours]),
    ];
    downloadCSV(`askbob-report-${range.id}.csv`, rows);
    toast("Report CSV downloaded", "success");
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Reports</h1>
          <p className="mt-1 text-sm text-ink-600">
            Throughput, confidence, and overrides, <span className="serif-accent text-brand">at a glance</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white p-1">
            <Calendar className="ml-1.5 h-4 w-4 text-ink-400" />
            {DATE_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRangeId(r.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                  r.id === rangeId ? "bg-navy text-white" : "text-ink-500 hover:bg-ink-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export report
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Analyses in range" value={filtered.length} />
        <Kpi label="Avg confidence" value={avgConf} mono />
        <Kpi label="Finalized" value={filtered.filter((a) => a.status === "finalized").length} />
        <Kpi label="In review" value={filtered.filter((a) => a.status === "in_review").length} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Volume by status */}
        <ChartCard title="Volume by status" subtitle="Analyses grouped by workflow state">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#647888" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94A6B5" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#F7F9FB" }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {statusData.map((d) => (
                  <Cell key={d.status} fill={STATUS_FILL[d.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Confidence distribution */}
        <ChartCard title="Confidence distribution" subtitle="All captured fields by confidence band">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={confData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#647888" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94A6B5" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#F7F9FB" }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {confData.map((d, i) => (
                  <Cell key={i} fill={CONFIDENCE_HEX[d.tier as "low" | "med" | "high"]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Override rate over time */}
        <ChartCard title="Override rate over time" subtitle="Share of fields adjusted by reviewers, weekly">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overrideData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#647888" }} axisLine={false} tickLine={false} />
              <YAxis
                unit="%"
                tick={{ fontSize: 12, fill: "#94A6B5" }}
                axisLine={false}
                tickLine={false}
                domain={[0, "dataMax + 4"]}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Override rate"]} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#1281DE"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#1281DE" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Average turn time */}
        <ChartCard title="Average turn time by module" subtitle="Hours from creation to last update">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={turnData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F6" />
              <XAxis dataKey="module" tick={{ fontSize: 12, fill: "#647888" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94A6B5" }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip cursor={{ fill: "#F7F9FB" }} contentStyle={tooltipStyle} formatter={(v) => [`${v} h`, "Avg turn time"]} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={80}>
                <Cell fill="#1281DE" />
                <Cell fill="#19D467" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E0E7EE",
  boxShadow: "0 10px 30px -12px rgba(15,24,32,0.25)",
  fontSize: 13,
};

function Kpi({ label, value, mono }: { label: string; value: number; mono?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold text-navy ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-navy">{title}</h3>
        <p className="text-xs text-ink-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
