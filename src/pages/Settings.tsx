import { useState } from "react";
import {
  Calculator,
  Users,
  Building2,
  ShieldCheck,
  Lock,
  RotateCcw,
  Eye,
  History,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { useToast } from "../components/Toast";
import { ROLES } from "../mock/roles";
import type { Permission } from "../mock/roles";
import { getAuditLog, AUDIT_ACTION_LABEL } from "../mock/audit";
import { formatDateTime } from "../lib/format";

const PERMISSION_LABEL: Record<Permission, string> = {
  "pii:reveal": "Reveal PII",
  "analysis:edit": "Edit analyses",
  "analysis:finalize": "Finalize analyses",
  "settings:manage": "Manage settings",
};

const AREAS = [
  {
    icon: Calculator,
    title: "Calculation rules",
    desc: "Versioned, per-tenant income & asset rule sets and agency-guideline overlays.",
  },
  {
    icon: Users,
    title: "Users and roles",
    desc: "SSO/OIDC identity, role assignment, and field-level override authority.",
  },
  {
    icon: Building2,
    title: "Tenants",
    desc: "Organization provisioning, branding, and data isolation boundaries.",
  },
  {
    icon: ShieldCheck,
    title: "Security",
    desc: "PII tokenization vault, detokenization policy, and audit-log retention.",
  },
];

export function Settings() {
  const { resetDemoData, role, can, confidenceLockThreshold, setConfidenceLockThreshold } = useApp();
  const toast = useToast();
  const roleDef = ROLES[role];
  const auditLog = getAuditLog().slice(0, 8);

  const canManage = can("settings:manage");
  const lockEnabled = confidenceLockThreshold != null;
  const [thresholdDraft, setThresholdDraft] = useState(confidenceLockThreshold ?? 97);

  const toggleLock = () => {
    if (!canManage) return;
    setConfidenceLockThreshold(lockEnabled ? null : thresholdDraft);
    toast(lockEnabled ? "Field-lock policy disabled" : `Fields ≥ ${thresholdDraft}% locked`, "info");
  };
  const changeThreshold = (n: number) => {
    const v = Math.min(100, Math.max(50, Math.round(n)));
    setThresholdDraft(v);
    if (lockEnabled) setConfidenceLockThreshold(v);
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="eyebrow">Configuration</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Settings</h1>
        <p className="mt-1 text-sm text-ink-600">
          Access control is <span className="serif-accent text-brand">live</span> in this prototype; the rest is configured by engineering.
        </p>
      </div>

      {/* Live: access control */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <h3 className="font-bold text-navy">Your access</h3>
          </div>
          <p className="mt-2 text-sm text-ink-600">
            Acting as <span className="font-semibold text-navy">{roleDef.label}</span>. Switch roles
            from the avatar menu (top right) to see permissions change across the app.
          </p>
          <p className="mt-3 eyebrow">Permissions</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(PERMISSION_LABEL) as Permission[]).map((p) => {
              const granted = roleDef.permissions.includes(p);
              return (
                <span
                  key={p}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    granted
                      ? "border-green/30 bg-green-tint text-green-deep"
                      : "border-ink-200 bg-ink-50 text-ink-400"
                  }`}
                >
                  {granted ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {PERMISSION_LABEL[p]}
                </span>
              );
            })}
          </div>
        </div>

        {/* Live: audit trail */}
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-brand" />
            <h3 className="font-bold text-navy">Recent privileged activity</h3>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Append-only audit trail (PII reveal, finalize, role changes). Mock — production writes
            to the tamper-evident audit store.
          </p>
          <div className="mt-3 space-y-2">
            {auditLog.length === 0 && (
              <p className="py-4 text-center text-sm text-ink-400">No activity yet.</p>
            )}
            {auditLog.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-navy">{AUDIT_ACTION_LABEL[e.action]}</span>
                  <span className="block truncate text-xs text-ink-500">{e.detail}</span>
                </div>
                <span className="shrink-0 text-right font-mono text-[11px] text-ink-400">
                  {formatDateTime(e.timestamp)}
                  <span className="block">{e.role}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live (admin): field-lock policy */}
      <div className="mt-4 card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-navy">Field-lock policy</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                  {canManage ? "Admin" : "Admin only"}
                </span>
              </div>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-500">
                Lock captured fields from editing once their extraction confidence is at or above a
                threshold — high-confidence values grey out and can't be changed. Applies across all
                analyses.
              </p>
            </div>
          </div>

          {/* On/off switch */}
          <button
            onClick={toggleLock}
            disabled={!canManage}
            role="switch"
            aria-checked={lockEnabled}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${
              lockEnabled ? "bg-green" : "bg-ink-300"
            }`}
            title={canManage ? "Toggle policy" : "Requires Administrator role"}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                lockEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className={`mt-4 flex flex-wrap items-center gap-4 ${lockEnabled ? "" : "opacity-50"}`}>
          <label className="text-sm font-medium text-ink-700">Lock at confidence ≥</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={50}
              max={100}
              value={thresholdDraft}
              disabled={!canManage || !lockEnabled}
              onChange={(e) => changeThreshold(Number(e.target.value))}
              className="h-2 w-48 cursor-pointer accent-green disabled:cursor-not-allowed"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={50}
                max={100}
                value={thresholdDraft}
                disabled={!canManage || !lockEnabled}
                onChange={(e) => changeThreshold(Number(e.target.value))}
                className="input w-20 font-mono"
              />
              <span className="font-mono text-sm text-ink-500">%</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          {lockEnabled ? (
            <>
              Fields with confidence <span className="font-semibold text-navy">≥ {confidenceLockThreshold}%</span> are
              read-only. Lower-confidence items stay editable for review.
            </>
          ) : (
            "Policy off — all fields are editable (subject to role and finalized status)."
          )}
        </p>
      </div>

      {/* Configured by engineering */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {AREAS.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.title} className="card flex items-start gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-navy">{a.title}</h3>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                    <Lock className="h-2.5 w-2.5" />
                    Configured by engineering
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{a.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prototype-only utility */}
      <div className="mt-6 card border-dashed p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-navy">Reset demo data</h3>
            <p className="mt-1 text-sm text-ink-500">
              Restore the original sample analyses and clear your edits. Prototype only.
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              resetDemoData();
              toast("Demo data reset to seed", "info");
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset data
          </button>
        </div>
      </div>
    </div>
  );
}
