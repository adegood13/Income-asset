import { Lock } from "lucide-react";
import type { ReactNode } from "react";

// Shared building blocks for the Settings screens.

export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-green" : "bg-ink-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function SettingRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy">{title}</p>
        {desc && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="mt-0.5 text-sm text-ink-500">{desc}</p>
    </div>
  );
}

export function ReadOnlyBanner({ canManage }: { canManage: boolean }) {
  if (canManage) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-600">
      <Lock className="h-4 w-4 shrink-0 text-ink-400" />
      Read-only — switch to the <span className="font-semibold text-navy">Administrator</span> role
      (avatar menu, top-right) to make changes.
    </div>
  );
}
