import { LayoutDashboard, Banknote, PiggyBank, BarChart3, Settings, FlaskConical } from "lucide-react";
import { navigate, useRoute, type Route } from "../state/router";
import { LogoMark } from "./Logo";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  match: (r: Route) => boolean;
}

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", match: (r) => r.name === "dashboard" },
  {
    label: "Income Analysis",
    icon: Banknote,
    path: "/income",
    match: (r) => r.name === "list" && r.module === "income",
  },
  {
    label: "Asset Analysis",
    icon: PiggyBank,
    path: "/asset",
    match: (r) => r.name === "list" && r.module === "asset",
  },
  { label: "Reports", icon: BarChart3, path: "/reports", match: (r) => r.name === "reports" },
  { label: "Settings", icon: Settings, path: "/settings", match: (r) => r.name === "settings" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const route = useRoute();

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-navy text-ink-300">
      {/* Brand anchor */}
      <button
        onClick={() => go("/")}
        className="flex items-center gap-3 px-5 py-5 text-left"
        aria-label="AskBob home"
      >
        <LogoMark size={38} />
        <span>
          <span className="block font-display text-lg font-extrabold leading-none tracking-tight text-white">
            AskBob
          </span>
          <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Income &amp; Assets
          </span>
        </span>
      </button>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.match(route);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
                ${active ? "bg-white/[0.07] text-white" : "text-ink-400 hover:bg-white/[0.04] hover:text-white"}`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient" />
              )}
              <Icon className={`h-[18px] w-[18px] ${active ? "text-brand-bright" : "text-ink-500 group-hover:text-ink-300"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Prototype disclaimer — makes the mock nature honest. */}
      <div className="m-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-green">
          <FlaskConical className="h-3.5 w-3.5" />
          Prototype
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
          UX validation build. All extraction, rules, and data are mocked.
        </p>
      </div>
    </div>
  );
}
