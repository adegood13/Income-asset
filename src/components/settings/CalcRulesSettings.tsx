import { useApp } from "../../state/AppContext";
import { INCOME_METHODS, ASSET_METHODS, GUIDELINE_GROUPS } from "../../mock/rules";
import { DOC_TYPE_LABEL } from "../../mock/extraction";
import { Switch, SettingRow, SectionHeader, ReadOnlyBanner } from "./primitives";

export function CalcRulesSettings() {
  const { config, updateConfig, can } = useApp();
  const canManage = can("settings:manage");

  const toggleMethod = (id: string, enabled: boolean) => {
    const set = new Set(config.disabledMethods);
    if (enabled) set.delete(id);
    else set.add(id);
    updateConfig({ disabledMethods: [...set] });
  };
  const toggleGuideline = (id: string, enabled: boolean) => {
    const set = new Set(config.disabledGuidelines);
    if (enabled) set.delete(id);
    else set.add(id);
    updateConfig({ disabledGuidelines: [...set] });
  };

  const methodBlock = (title: string, methods: typeof INCOME_METHODS) => (
    <div className="card p-5">
      <h3 className="mb-1 font-bold text-navy">{title}</h3>
      <p className="mb-2 text-xs text-ink-500">Enabled methods appear in the workspace method dropdown.</p>
      {methods.map((m) => {
        const enabled = !config.disabledMethods.includes(m.id);
        return (
          <SettingRow
            key={m.id}
            title={m.label}
            desc={m.blurb}
          >
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1 sm:flex">
                {(m.appliesTo ?? []).map((t) => (
                  <span key={t} className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                    {DOC_TYPE_LABEL[t]}
                  </span>
                ))}
              </div>
              <span className="font-mono text-[11px] text-ink-400">v1.0</span>
              <Switch checked={enabled} onChange={(v) => toggleMethod(m.id, v)} disabled={!canManage} />
            </div>
          </SettingRow>
        );
      })}
    </div>
  );

  return (
    <div>
      <SectionHeader
        title="Calculation rules"
        desc="Per-tenant income & asset methods and guideline overlays. Toggles take effect live in the workspace."
      />
      <ReadOnlyBanner canManage={canManage} />
      <div className="space-y-4">
        {methodBlock("Income methods", INCOME_METHODS)}
        {methodBlock("Asset methods", ASSET_METHODS)}

        <div className="card p-5">
          <h3 className="mb-1 font-bold text-navy">Guideline overlays</h3>
          <p className="mb-2 text-xs text-ink-500">
            Agencies and Non-QM investors offered in the workspace guideline selector.
          </p>
          {GUIDELINE_GROUPS.map((g) => (
            <div key={g.group} className="mt-3 first:mt-0">
              <p className="eyebrow mb-1">{g.group}</p>
              {g.options.map((o) => {
                const enabled = !config.disabledGuidelines.includes(o.id);
                return (
                  <SettingRow key={o.id} title={o.label}>
                    <Switch checked={enabled} onChange={(v) => toggleGuideline(o.id, v)} disabled={!canManage} />
                  </SettingRow>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
