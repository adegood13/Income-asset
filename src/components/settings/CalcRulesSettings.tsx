import { useState } from "react";
import { Plus, Trash2, Pencil, Copy } from "lucide-react";
import { useApp } from "../../state/AppContext";
import {
  INCOME_METHODS,
  ASSET_METHODS,
  GUIDELINE_GROUPS,
  CUSTOM_METHOD_KINDS,
  BUILTIN_FORMULA,
} from "../../mock/rules";
import { validateFormula } from "../../mock/formula";
import { DOC_TYPE_LABEL } from "../../mock/extraction";
import type { CustomMethod, CustomMethodKind } from "../../mock/config";
import type { ModuleKind } from "../../types";
import { uid } from "../../lib/id";
import { Switch, SettingRow, SectionHeader, ReadOnlyBanner } from "./primitives";

const FORMULA_CHIPS = ['sum("Deposits")', 'sum("Net Profit")', "months", "/ 12", "* 0.5", "+", "-", "(", ")"];

export function CalcRulesSettings() {
  const { config, updateConfig, can } = useApp();
  const canManage = can("settings:manage");

  const [addMode, setAddMode] = useState<"formula" | "template">("formula");
  // Formula add-form
  const [fLabel, setFLabel] = useState("");
  const [fModule, setFModule] = useState<ModuleKind>("income");
  const [fFormula, setFFormula] = useState("");
  // Template add-form
  const [tKind, setTKind] = useState<CustomMethodKind>("bank_income_factor");
  const tMeta = CUSTOM_METHOD_KINDS.find((k) => k.id === tKind)!;
  const [tFactor, setTFactor] = useState(tMeta.defaultFactor);

  const fErr = fFormula.trim() ? validateFormula(fFormula) : "Enter a formula";

  const toggleMethod = (id: string, enabled: boolean) => {
    const set = new Set(config.disabledMethods);
    enabled ? set.delete(id) : set.add(id);
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
    enabled ? set.delete(id) : set.add(id);
    updateConfig({ disabledGuidelines: [...set] });
  };

  const setCustom = (methods: CustomMethod[]) => updateConfig({ customMethods: methods });
  const patchCustom = (id: string, patch: Partial<CustomMethod>) =>
    setCustom(config.customMethods.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const addFormulaMethod = () => {
    if (validateFormula(fFormula)) return;
    setCustom([
      ...config.customMethods,
      { id: uid("cm"), label: fLabel.trim() || "Custom formula", module: fModule, kind: "formula", factorPct: 0, formula: fFormula.trim(), enabled: true },
    ]);
    setFLabel("");
    setFFormula("");
  };
  const addTemplateMethod = () => {
    const meta = CUSTOM_METHOD_KINDS.find((k) => k.id === tKind)!;
    setCustom([
      ...config.customMethods,
      { id: uid("cm"), label: meta.label, module: meta.module, kind: tKind, factorPct: tFactor, enabled: true },
    ]);
  };
  const forkBuiltin = (id: string, label: string, module: ModuleKind) => {
    setCustom([
      ...config.customMethods,
      {
        id: uid("cm"),
        label: `${label} (custom)`,
        module,
        kind: "formula",
        factorPct: 0,
        formula: BUILTIN_FORMULA[id] ?? "",
        enabled: true,
      },
    ]);
  };

  const methodBlock = (title: string, methods: typeof INCOME_METHODS) => (
    <div className="card p-5">
      <h3 className="mb-1 font-bold text-navy">{title}</h3>
      <p className="mb-2 text-xs text-ink-500">
        Rename, enable/disable, or fork the math into an editable formula. Changes apply live.
      </p>
      {methods.map((m) => {
        const enabled = !config.disabledMethods.includes(m.id);
        const effective = config.methodOverrides[m.id] ?? m.label;
        return (
          <div key={m.id} className="border-b border-ink-100 py-3 last:border-0">
            <div className="flex items-center gap-3">
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
            {/* Representative formula + fork */}
            <div className="mt-1.5 flex items-center justify-between gap-3 pl-1.5">
              <code className="truncate font-mono text-[11px] text-ink-400">{BUILTIN_FORMULA[m.id] ?? "—"}</code>
              {canManage && (
                <button
                  onClick={() => forkBuiltin(m.id, effective, m.module)}
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand transition hover:underline"
                  title="Create an editable formula copy"
                >
                  <Copy className="h-3 w-3" /> Duplicate as editable formula
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <SectionHeader
        title="Calculation rules"
        desc="Rename or disable built-ins, write your own formula methods, and toggle guideline overlays. Changes apply live."
      />
      <ReadOnlyBanner canManage={canManage} />
      <div className="space-y-4">
        {methodBlock("Income methods", INCOME_METHODS)}
        {methodBlock("Asset methods", ASSET_METHODS)}

        {/* Custom methods */}
        <div className="card p-5">
          <h3 className="mb-1 font-bold text-navy">Custom methods</h3>
          <p className="mb-3 text-xs text-ink-500">Methods you define. Formula methods compute live in the workspace.</p>

          {config.customMethods.length === 0 && <p className="py-2 text-sm text-ink-400">No custom methods yet.</p>}
          {config.customMethods.map((cm) => {
            const isFormula = cm.kind === "formula";
            const meta = CUSTOM_METHOD_KINDS.find((k) => k.id === cm.kind);
            const err = isFormula && cm.formula ? validateFormula(cm.formula) : null;
            return (
              <div key={cm.id} className="border-b border-ink-100 py-3 last:border-0">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    value={cm.label}
                    disabled={!canManage}
                    onChange={(e) => patchCustom(cm.id, { label: e.target.value })}
                    className="input min-w-[200px] flex-1 py-1.5 text-sm font-semibold disabled:opacity-60"
                  />
                  <span className="rounded bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    {cm.module}
                  </span>
                  {!isFormula && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={cm.factorPct}
                        disabled={!canManage}
                        onChange={(e) => patchCustom(cm.id, { factorPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                        className="input w-20 py-1.5 font-mono text-sm disabled:opacity-60"
                        title={meta?.factorLabel}
                      />
                      <span className="font-mono text-xs text-ink-400">%</span>
                    </div>
                  )}
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
                {isFormula && (
                  <div className="mt-2">
                    <input
                      value={cm.formula ?? ""}
                      disabled={!canManage}
                      onChange={(e) => patchCustom(cm.id, { formula: e.target.value })}
                      placeholder='e.g. sum("Deposits") / months'
                      className={`input w-full font-mono text-sm disabled:opacity-60 ${err ? "border-danger" : ""}`}
                    />
                    {err && <p className="mt-1 text-[11px] text-danger">{err}</p>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add method */}
          {canManage && (
            <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-3">
              <div className="mb-3 inline-flex rounded-lg border border-ink-200 bg-surface p-0.5">
                <button
                  onClick={() => setAddMode("formula")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${addMode === "formula" ? "bg-navy text-white" : "text-ink-600"}`}
                >
                  Write a formula
                </button>
                <button
                  onClick={() => setAddMode("template")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${addMode === "template" ? "bg-navy text-white" : "text-ink-600"}`}
                >
                  From a template
                </button>
              </div>

              {addMode === "formula" ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input className="input flex-1" placeholder="Method name" value={fLabel} onChange={(e) => setFLabel(e.target.value)} />
                    <select className="input w-36" value={fModule} onChange={(e) => setFModule(e.target.value as ModuleKind)}>
                      <option value="income">Income</option>
                      <option value="asset">Asset</option>
                    </select>
                  </div>
                  <textarea
                    className={`input min-h-[64px] w-full resize-y font-mono text-sm ${fFormula.trim() && fErr ? "border-danger" : ""}`}
                    placeholder={'sum("Deposits") / months'}
                    value={fFormula}
                    onChange={(e) => setFFormula(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {FORMULA_CHIPS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setFFormula((v) => (v ? `${v} ${c}` : c))}
                        className="rounded-md border border-ink-200 bg-surface px-2 py-1 font-mono text-[11px] text-ink-600 hover:border-brand hover:text-brand"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-[11px] ${fFormula.trim() && fErr ? "text-danger" : "text-ink-400"}`}>
                      {fFormula.trim() && fErr
                        ? fErr
                        : 'Use sum("text") to total fields/groups, months for statement count, and + - * / ( ).'}
                    </p>
                    <button className="btn-primary shrink-0" onClick={addFormulaMethod} disabled={!!fErr}>
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-ink-500">Template</label>
                    <select
                      className="input w-60"
                      value={tKind}
                      onChange={(e) => {
                        const k = e.target.value as CustomMethodKind;
                        setTKind(k);
                        setTFactor(CUSTOM_METHOD_KINDS.find((x) => x.id === k)!.defaultFactor);
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
                    <label className="mb-1 block text-[11px] font-medium text-ink-500">{tMeta.factorLabel}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input w-24 font-mono"
                      value={tFactor}
                      onChange={(e) => setTFactor(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    />
                  </div>
                  <button className="btn-primary" onClick={addTemplateMethod}>
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guideline overlays */}
        <div className="card p-5">
          <h3 className="mb-1 font-bold text-navy">Guideline overlays</h3>
          <p className="mb-2 text-xs text-ink-500">Agencies and Non-QM investors offered in the workspace selector.</p>
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
