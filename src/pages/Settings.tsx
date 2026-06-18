import { Calculator, Users, Building2, ShieldCheck, Lock, RotateCcw } from "lucide-react";
import { useApp } from "../state/AppContext";
import { useToast } from "../components/Toast";

const AREAS = [
  {
    icon: Calculator,
    title: "Calculation rules",
    desc: "Versioned, per-tenant income & asset rule sets and agency-guideline overlays.",
  },
  {
    icon: Users,
    title: "Users and roles",
    desc: "Underwriter, reviewer, and admin permissions; field-level override authority.",
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
  const { resetDemoData } = useApp();
  const toast = useToast();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="eyebrow">Configuration</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          These areas are configured by engineering and are not part of this prototype.
        </p>
      </div>

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
