import { Eye, EyeOff, Menu, ShieldCheck } from "lucide-react";
import { useApp } from "../state/AppContext";
import { maskTenant } from "../mock/tokenization";

interface Props {
  onOpenMenu: () => void;
}

export function TopBar({ onOpenMenu }: Props) {
  const { user, tenantId, reveal, setReveal } = useApp();
  const initials = user
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onOpenMenu} className="btn-ghost px-2 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      {/* Tenant / org — masked, per privacy-first default */}
      <div className="hidden items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 sm:flex">
        <ShieldCheck className="h-4 w-4 text-brand" />
        <span className="font-mono text-xs font-medium text-ink-600">{maskTenant(tenantId)}</span>
      </div>

      <div className="flex-1" />

      {/* Global PII mask toggle — off by default (identifiers masked). */}
      <button
        onClick={() => setReveal(!reveal)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition
          ${reveal ? "border-conf-low/40 bg-[#FDECEC] text-[#B42B30]" : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50"}`}
        title={reveal ? "PII is revealed — click to mask" : "PII is masked — click to reveal"}
        aria-pressed={reveal}
      >
        {reveal ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{reveal ? "PII revealed" : "PII masked"}</span>
      </button>

      <div className="flex items-center gap-2.5 pl-1">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold leading-tight text-navy">{user}</div>
          <div className="text-xs text-ink-400">Senior Underwriter</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-brand">
          {initials}
        </div>
      </div>
    </header>
  );
}
