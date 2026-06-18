import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Menu,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Check,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { maskTenant } from "../mock/tokenization";
import { ROLES, ROLE_LIST } from "../mock/roles";

interface Props {
  onOpenMenu: () => void;
}

export function TopBar({ onOpenMenu }: Props) {
  const { user, tenantId, reveal, setReveal, role, setRole, can, theme, setTheme } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const canReveal = can("pii:reveal");

  const initials = user
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const cycleTheme = () => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onOpenMenu} className="btn-ghost px-2 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      {/* Tenant / org — masked, per privacy-first default */}
      <div className="hidden items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 sm:flex">
        <ShieldCheck className="h-4 w-4 text-brand" />
        <span className="font-mono text-xs font-medium text-ink-600">{maskTenant(tenantId)}</span>
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={cycleTheme}
        className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-surface px-3 py-1.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
        title={`Theme: ${theme} (click to change)`}
        aria-label={`Theme: ${theme}`}
      >
        <ThemeIcon className="h-4 w-4" />
        <span className="hidden capitalize md:inline">{theme}</span>
      </button>

      {/* Global PII mask toggle — gated by the pii:reveal permission. */}
      {canReveal ? (
        <button
          onClick={() => setReveal(!reveal)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition
            ${reveal ? "border-danger/40 bg-danger-tint text-danger" : "border-ink-300 bg-surface text-ink-600 hover:bg-ink-50"}`}
          title={reveal ? "PII is revealed — click to mask" : "PII is masked — click to reveal"}
          aria-pressed={reveal}
        >
          {reveal ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span className="hidden sm:inline">{reveal ? "PII revealed" : "PII masked"}</span>
        </button>
      ) : (
        <span
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm font-semibold text-ink-400"
          title={`Your role (${ROLES[role].label}) cannot reveal PII`}
        >
          <Lock className="h-4 w-4" />
          <span className="hidden sm:inline">PII locked</span>
        </span>
      )}

      {/* Avatar + role switcher */}
      <div className="relative pl-1">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full p-0.5 pr-1 transition hover:bg-ink-50"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold leading-tight text-navy">{user}</div>
            <div className="text-xs text-ink-400">{ROLES[role].label}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-lift">
            {initials}
          </div>
          <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-float animate-scale-in">
              <div className="border-b border-ink-200 px-4 py-3">
                <div className="text-sm font-semibold text-navy">{user}</div>
                <div className="text-xs text-ink-500">{user.toLowerCase().replace(" ", ".")}@askbobai.com</div>
              </div>
              <div className="px-4 py-2">
                <p className="eyebrow mb-1.5">Acting as role</p>
                <p className="mb-2 text-[11px] leading-relaxed text-ink-500">
                  Demo control. In production, role comes from your identity provider and is
                  enforced server-side.
                </p>
                <div className="space-y-1">
                  {ROLE_LIST.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setRole(r.id);
                        setMenuOpen(false);
                      }}
                      className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                        r.id === role ? "bg-brand-tint" : "hover:bg-ink-50"
                      }`}
                    >
                      <span className="mt-0.5 h-4 w-4 shrink-0">
                        {r.id === role && <Check className="h-4 w-4 text-brand" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy">{r.label}</span>
                        <span className="block text-[11px] leading-snug text-ink-500">{r.description}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                          {r.permissions.includes("pii:reveal") ? (
                            <>
                              <Eye className="h-3 w-3" /> PII access
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" /> No PII
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
