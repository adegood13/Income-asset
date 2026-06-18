import { useApp } from "../../state/AppContext";
import { maskTenant } from "../../mock/tokenization";
import { DATA_REGIONS, type DataRegion } from "../../mock/config";
import { Switch, SettingRow, SectionHeader, ReadOnlyBanner } from "./primitives";

export function TenantSettings() {
  const { config, updateConfig, can, tenantId, reveal } = useApp();
  const canManage = can("settings:manage");
  const org = config.org;
  const setOrg = (patch: Partial<typeof org>) => updateConfig({ org: { ...org, ...patch } });

  return (
    <div>
      <SectionHeader
        title="Tenant"
        desc="Organization settings, data residency, and session policy. One tenant per organization with isolated data."
      />
      <ReadOnlyBanner canManage={canManage} />

      <div className="card p-5">
        <SettingRow title="Organization name" desc="Shown on exports and worksheets.">
          <input
            className="input w-64"
            value={org.name}
            disabled={!canManage}
            onChange={(e) => setOrg({ name: e.target.value })}
          />
        </SettingRow>

        <SettingRow title="Tenant ID" desc="Immutable identifier, masked for privacy.">
          <span className="font-mono text-sm text-ink-600">
            {reveal ? `Tenant ${tenantId}` : maskTenant(tenantId)}
          </span>
        </SettingRow>

        <SettingRow title="Data residency" desc="Where this tenant's data is stored and processed.">
          <select
            className="input w-56"
            value={org.dataRegion}
            disabled={!canManage}
            onChange={(e) => setOrg({ dataRegion: e.target.value as DataRegion })}
          >
            {DATA_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow title="Session timeout" desc="Auto-logout after inactivity.">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={480}
              className="input w-24 font-mono"
              value={org.sessionTimeoutMins}
              disabled={!canManage}
              onChange={(e) => setOrg({ sessionTimeoutMins: Math.max(5, Math.min(480, Number(e.target.value) || 0)) })}
            />
            <span className="text-sm text-ink-500">minutes</span>
          </div>
        </SettingRow>

        <SettingRow title="Enforce SSO" desc="Require single sign-on for all members; disable password login.">
          <Switch checked={org.enforceSSO} onChange={(v) => setOrg({ enforceSSO: v })} disabled={!canManage} />
        </SettingRow>
      </div>
    </div>
  );
}
