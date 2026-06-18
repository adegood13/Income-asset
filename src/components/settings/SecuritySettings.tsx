import { useState } from "react";
import { useApp } from "../../state/AppContext";
import { useToast } from "../Toast";
import type { MaskStyle } from "../../mock/config";
import { Switch, SettingRow, SectionHeader, ReadOnlyBanner } from "./primitives";

export function SecuritySettings() {
  const {
    config,
    updateConfig,
    can,
    confidenceLockThreshold,
    setConfidenceLockThreshold,
  } = useApp();
  const toast = useToast();
  const canManage = can("settings:manage");
  const sec = config.security;
  const setSec = (patch: Partial<typeof sec>) => updateConfig({ security: { ...sec, ...patch } });

  const lockEnabled = confidenceLockThreshold != null;
  const [thresholdDraft, setThresholdDraft] = useState(confidenceLockThreshold ?? 97);
  const changeThreshold = (n: number) => {
    const v = Math.min(100, Math.max(50, Math.round(n)));
    setThresholdDraft(v);
    if (lockEnabled) setConfidenceLockThreshold(v);
  };

  return (
    <div>
      <SectionHeader
        title="Security"
        desc="Authentication, PII handling, and audit policy. Production enforces these server-side."
      />
      <ReadOnlyBanner canManage={canManage} />

      <div className="card p-5">
        <SettingRow title="Require MFA" desc="All members must use multi-factor authentication.">
          <Switch checked={sec.mfaRequired} onChange={(v) => setSec({ mfaRequired: v })} disabled={!canManage} />
        </SettingRow>

        <SettingRow
          title="Detokenization requires a reason"
          desc="Prompt for a justification (logged) whenever a user reveals PII."
        >
          <Switch
            checked={sec.detokenizationRequiresReason}
            onChange={(v) => setSec({ detokenizationRequiresReason: v })}
            disabled={!canManage}
          />
        </SettingRow>

        <SettingRow title="PII mask style" desc="How identifiers display when masked.">
          <select
            className="input w-56"
            value={sec.maskStyle}
            disabled={!canManage}
            onChange={(e) => setSec({ maskStyle: e.target.value as MaskStyle })}
          >
            <option value="last4">Show last 4 (•••• 1234)</option>
            <option value="full">Fully masked (••••)</option>
          </select>
        </SettingRow>

        <SettingRow title="Audit log retention" desc="How long privileged-action records are kept.">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={30}
              max={2555}
              className="input w-24 font-mono"
              value={sec.auditRetentionDays}
              disabled={!canManage}
              onChange={(e) => setSec({ auditRetentionDays: Math.max(30, Number(e.target.value) || 0) })}
            />
            <span className="text-sm text-ink-500">days</span>
          </div>
        </SettingRow>
      </div>

      {/* IP allowlist */}
      <div className="card mt-4 p-5">
        <p className="text-sm font-semibold text-navy">IP allowlist</p>
        <p className="mt-0.5 text-xs text-ink-500">
          Restrict access to these CIDR ranges (one per line). Empty = no restriction.
        </p>
        <textarea
          className="input mt-2 min-h-[80px] resize-y font-mono text-sm"
          placeholder={"203.0.113.0/24\n198.51.100.4/32"}
          value={sec.ipAllowlist}
          disabled={!canManage}
          onChange={(e) => setSec({ ipAllowlist: e.target.value })}
        />
      </div>

      {/* Field-lock policy (data integrity) */}
      <div className="card mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-navy">Field-lock policy</p>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-ink-500">
              Lock captured fields from editing once their extraction confidence is at or above a
              threshold. High-confidence values grey out across all analyses.
            </p>
          </div>
          <Switch
            checked={lockEnabled}
            disabled={!canManage}
            onChange={(v) => {
              setConfidenceLockThreshold(v ? thresholdDraft : null);
              toast(v ? `Fields ≥ ${thresholdDraft}% locked` : "Field-lock policy disabled", "info");
            }}
          />
        </div>
        <div className={`mt-4 flex flex-wrap items-center gap-4 ${lockEnabled ? "" : "opacity-50"}`}>
          <label className="text-sm font-medium text-ink-700">Lock at confidence ≥</label>
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
    </div>
  );
}
