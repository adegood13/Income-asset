import { useState } from "react";
import {
  ShieldCheck,
  Calculator,
  Users,
  Building2,
  Lock,
  History,
  RotateCcw,
  Eye,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { useToast } from "../components/Toast";
import { ROLES, type Permission } from "../mock/roles";
import { getAuditLog, AUDIT_ACTION_LABEL } from "../mock/audit";
import { formatDateTime } from "../lib/format";
import { CalcRulesSettings } from "../components/settings/CalcRulesSettings";
import { UsersRolesSettings } from "../components/settings/UsersRolesSettings";
import { TenantSettings } from "../components/settings/TenantSettings";
import { SecuritySettings } from "../components/settings/SecuritySettings";
import { SectionHeader } from "../components/settings/primitives";
import { PageHero, HeroAccent } from "../components/PageHero";

const PERMISSION_LABEL: Record<Permission, string> = {
  "pii:reveal": "Reveal PII",
  "analysis:edit": "Edit analyses",
  "analysis:finalize": "Finalize analyses",
  "settings:manage": "Manage settings",
};

type TabId = "access" | "rules" | "users" | "tenant" | "security" | "audit" | "data";

const TABS: { id: TabId; label: string; icon: typeof ShieldCheck }[] = [
  { id: "access", label: "Access", icon: ShieldCheck },
  { id: "rules", label: "Calculation rules", icon: Calculator },
  { id: "users", label: "Users & roles", icon: Users },
  { id: "tenant", label: "Tenant", icon: Building2 },
  { id: "security", label: "Security", icon: Lock },
  { id: "audit", label: "Audit log", icon: History },
  { id: "data", label: "Demo data", icon: RotateCcw },
];

export function Settings() {
  const [tab, setTab] = useState<TabId>("access");

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHero
        eyebrow="Configuration"
        title="Settings"
        subtitle={
          <>
            Rules, roles, tenant, and security — <HeroAccent>configured</HeroAccent> for the demo.
          </>
        }
      />

      {/* Tab bar */}
      <div className="mb-6 mt-6 flex flex-wrap gap-1.5 border-b border-ink-200 pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                active ? "bg-navy text-white" : "text-ink-600 hover:bg-ink-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "access" && <AccessSection />}
      {tab === "rules" && <CalcRulesSettings />}
      {tab === "users" && <UsersRolesSettings />}
      {tab === "tenant" && <TenantSettings />}
      {tab === "security" && <SecuritySettings />}
      {tab === "audit" && <AuditSection />}
      {tab === "data" && <DemoDataSection />}
    </div>
  );
}

function AccessSection() {
  const { role } = useApp();
  const roleDef = ROLES[role];
  return (
    <div>
      <SectionHeader
        title="Your access"
        desc="Switch roles from the avatar menu (top-right) to see permissions change across the app."
      />
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand" />
          <span className="font-semibold text-navy">{roleDef.label}</span>
        </div>
        <p className="mt-2 text-sm text-ink-600">{roleDef.description}</p>
        <p className="eyebrow mb-2 mt-4">Permissions</p>
        <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}

function AuditSection() {
  const log = getAuditLog().slice(0, 40);
  return (
    <div>
      <SectionHeader
        title="Audit log"
        desc="Append-only record of privileged actions (PII reveal, finalize, role & policy changes). Mock — production writes to a tamper-evident store."
      />
      <div className="card divide-y divide-ink-100 p-2">
        {log.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No activity yet.</p>}
        {log.map((e) => (
          <div key={e.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
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
  );
}

function DemoDataSection() {
  const { resetDemoData } = useApp();
  const toast = useToast();
  return (
    <div>
      <SectionHeader title="Demo data" desc="Prototype utilities for testing and demos." />
      <div className="card border-dashed p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-navy">Reset demo data</h3>
            <p className="mt-1 text-sm text-ink-500">
              Restore the original sample analyses and clear your edits. Does not reset Settings config.
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
