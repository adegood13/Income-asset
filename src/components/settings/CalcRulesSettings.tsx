import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useApp } from "../../state/AppContext";
import {
  INCOME_METHODS,
  ASSET_METHODS,
  GUIDELINE_GROUPS,
  CUSTOM_METHOD_KINDS,
} from "../../mock/rules";
import { DOC_TYPE_LABEL } from "../../mock/extraction";
import type { CustomMethod, CustomMethodKind } from "../../mock/config";
import { uid } from "../../lib/id";
import { Switch, SettingRow, SectionHeader, ReadOnlyBanner } from "./primitives";

export function CalcRulesSettings() {
  const { config, updateConfig, can } = useApp();
  const canManage = can("settings:manage");

  // Add-custom-method form state.
  const [newLabel, setNewLabel] = useState("");
  const [newKind, setNewKind] = useState<CustomMethodKind>("bank_income_factor");
  const kindMeta = CUSTOM_METHOD_KINDS.find((k) => k.id === newKind)!;
  const [newFactor, setNewFactor] = useState(kindMeta.defaultFactor);

  const toggleMethod = (id: string, enabled: boolean) => {
    const set = new Set(config.disabledMethods);
    if (enabled) set.delete(id);
    else set.add(id);
    updateConfig({ disabledMethods: [...set] });
  };
  const renameMethod = (id: string, label: string, original: string) => {
    const o = { ...config.methodOverrides };
    if (label.trim() && label.trim() !== original) o[id] = label.trim();
    else delete o[id];
    updateConfig({ methodOverrides: o });
  };
  const toggleGuideline = (id: string, enabled: boolean) => {
    const set = new Set(config.disabledGuidelines);
    if (enabled) set.delete(id);
    else set.add(id);
    updateConfig({ disabledGuidelines: [...set] });
  };

  const setCustom = (methods: CustomMethod[]) => updateConfig({ customMethods: methods });
  const patchCustom = (id: string, patch: Partial<CustomMethod>) =>
    setCustom(config.customMethods.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const addCustom = () => {
    const meta = CUSTOM_METHOD_KINDS.find((k) => k.id === newKind)!;
    setCustom([
      ...config.customMethods,
      {
        id: uid("cm"),
        label: newLabel.trim() || meta.label,
        module: meta.module,
        kind: newKind,
        factorPct: newFactor,
        enabled: true,
      },
    ]);
    setNewLabel("");
  };

  const methodBlock = (title: string, methods: typeof INCOME_METHODS) => (
    <div className="card p-5">
      <h3 className="mb-1 font-bold text-navy">{title}</h3>
      <p className="mb-2 text-xs text-ink-500">Rename, enable/disable. Changes apply live in the workspace.</p>
      {methods.map((m) => {
        const enabled = !config.disabledMethods.includes(m.id);
        const effective = config.methodOverrides[m.id] ?? m.label;
        return (
          <div key={m.id} className="flex items-center gap-3 border-b border-ink-100 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              {canManage ? (
                <div className="flex items-center gap-1.5">
                  <Pencil className="h-3 w-3 shrink-0 text-ink-300" />
                  <input
                    key={m.id + effective}
                    defaultValue={effective}
                    onBlur={(e) => renameMethod(m.id, e.target.value, m.label)}
                    className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold text-navy hover:border-ink-200 focus:border-brand focus:bg-surface focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm font-semibold text-navy">{effective}</span>
              )}
              <p className="mt-0.5 pl-1.5 text-xs text-ink-500">{m.blurb}</p>
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              {(m.appliesTo ?? []).map((t) => (
                <span key={t} className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
                  {DOC_TYPE_LABEL[t]}
                </span>
              ))}
            </div>
            <Switch checked={enabled} onChange={(v) => toggleMethod(m.id, v)} disabled={!canManage} />
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <SectionHeader
        title="Calculation rules"
        desc="Rename or disable built-in methods, build new ones, and toggle guideline overlays. Changes apply live."
      />
      <ReadOnlyBanner canManage={canManage} />
      <div className="space-y-4">
        {methodBlock("Income methods", INCOME_METHODS)}
        {methodBlock("Asset methods", ASSET_METHODS)}

        {/* Custom (admin-defined) methods */}
        <div className="card p-5">
          <h3 className="mb-1 font-bold text-navy">Custom methods</h3>
          <p className="mb-3 text-xs text-ink-500">
            Admin-defined methods built from a template. These compute and appear in the workspace.
          </p>

          {config.customMethods.length === 0 && (
            <p className="py-2 text-sm text-ink-400">No custom methods yet.</p>
          )}
          {config.customMethods.map((cm) => {
            const meta = CUSTOM_METHOD_KINDS.find((k) => k.id === cm.kind)!;
            return (
              <div key={cm.id} className="flex flex-wrap items-center gap-3 border-b border-ink-100 py-3 last:border-0">
                <input
                  value={cm.label}
                  disabled={!canManage}
                  onChange={(e) => patchCustom(cm.id, { label: e.target.value })}
                  className="input min-w-[200px] flex-1 py-1.5 text-sm font-semibold disabled:opacity-60"
                />
                <span className="rounded bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  {meta.module}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cm.factorPct}
                    disabled={!canManage}
                    onChange={(e) => patchCustom(cm.id, { factorPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                    className="input w-20 py-1.5 font-mono text-sm disabled:opacity-60"
                    title={meta.factorLabel}
                  />
                  <span className="font-mono text-xs text-ink-400">%</span>
                </div>
                <Switch checked={cm.enabled} onChange={(v) => patchCustom(cm.id, { enabled: v })} disabled={!canManage} />
                <button
                  onClick={() => setCustom(config.customMethods.filter((x) => x.id !== cm.id))}
                  disabled={!canManage}
                  className="rounded-md p-1.5 text-ink-400 transition hover:bg-danger-tint hover:text-danger disabled:opacity-40"
                  title="Delete method"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {/* Add form */}
          {canManage && (
            <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-3">
              <p className="eyebrow mb-2">Add a method</p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-medium text-ink-500">Name</label>
                  <input
                    className="input"
                    placeholder={kindMeta.label}
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-ink-500">Template</label>
                  <select
                    className="input w-60"
                    value={newKind}
                    onChange={(e) => {
                      const k = e.target.value as CustomMethodKind;
                      setNewKind(k);
                      setNewFactor(CUSTOM_METHOD_KINDS.find((x) => x.id === k)!.defaultFactor);
                    }}
                  >
                    {CUSTOM_METHOD_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-ink-500">{kindMeta.factorLabel}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="input w-24 font-mono"
                    value={newFactor}
                    onChange={(e) => setNewFactor(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  />
                </div>
                <button className="btn-primary" onClick={addCustom}>
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <p className="mt-2 text-[11px] text-ink-400">{kindMeta.factorHint}</p>
            </div>
          )}
        </div>

        {/* Guideline overlays */}
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
