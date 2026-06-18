/* =============================================================================
 * SEAM 2 — CALCULATION RULES ENGINE  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with the real, versioned, per-tenant rules
 * engine (agency guidelines, investor overlays, audit-grade lineage).
 *
 * Each method here is a small hardcoded function that reads the *current*
 * (possibly overridden) field values off the provided documents and returns a
 * `CalculationResult` whose `steps[]` ARE the audit story: input · operation ·
 * running result. The UI renders those steps verbatim as the lineage.
 * ========================================================================== */

import type {
  CalcStep,
  CalculationResult,
  CapturedField,
  DocType,
  DocumentRecord,
  ModuleKind,
} from "../types";
import { asNumber, formatMoney, formatNumber } from "../lib/format";
import type { CustomMethod, CustomMethodKind } from "./config";
import { evaluateFormula } from "./formula";

interface MethodDef {
  id: string;
  label: string;
  module: ModuleKind;
  // Short note shown under the method dropdown.
  blurb: string;
  // If set, the method is only offered when one of these doc types is present.
  appliesTo?: DocType[];
  compute: (docs: DocumentRecord[]) => CalculationResult;
}

/* ----------------------------- field helpers ------------------------------ */

function allFields(docs: DocumentRecord[]): CapturedField[] {
  return docs.flatMap((d) => d.fields);
}

function findField(
  docs: DocumentRecord[],
  labelIncludes: string,
  docType?: string,
): CapturedField | undefined {
  const needle = labelIncludes.toLowerCase();
  for (const d of docs) {
    if (docType && d.docType !== docType) continue;
    const hit = d.fields.find((x) => x.label.toLowerCase().includes(needle));
    if (hit) return hit;
  }
  return undefined;
}

function findAll(docs: DocumentRecord[], labelIncludes: string): CapturedField[] {
  const needle = labelIncludes.toLowerCase();
  return allFields(docs).filter((x) => x.label.toLowerCase().includes(needle));
}

function num(field?: CapturedField): number {
  return field ? asNumber(field.value) : 0;
}

// Extract the month number from a paystub period label like "...05/31/2026".
function monthsElapsedFrom(periodLabel: string): number {
  const m = periodLabel.match(/(\d{1,2})\/\d{1,2}\/\d{2,4}/);
  if (m) return Math.max(1, parseInt(m[1], 10));
  return 12;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function result(
  id: string,
  label: string,
  monthly: number,
  steps: CalcStep[],
): CalculationResult {
  return { method: id, methodLabel: label, monthlyQualifying: round2(monthly), steps };
}

/* ----------------------------- INCOME methods ----------------------------- */

const w2TwoYearAverage: MethodDef = {
  id: "w2_2yr_avg",
  label: "2-Year Average, Salaried W-2",
  module: "income",
  appliesTo: ["W2"],
  blurb: "Averages Box 1 wages across available W-2 years, then divides by 12.",
  compute: (docs) => {
    const w2s = docs.filter((d) => d.docType === "W2");
    const steps: CalcStep[] = [];
    let total = 0;
    w2s.forEach((d) => {
      const wages = num(d.fields.find((x) => x.label.includes("Box 1")));
      total += wages;
      steps.push({
        label: `Box 1 wages · ${d.periodLabel.replace("Tax Year ", "")}`,
        detail: `Reported wages ${formatMoney(wages)}`,
        result: wages,
      });
    });
    const years = Math.max(1, w2s.length);
    const annualAvg = total / years;
    steps.push({
      label: years > 1 ? `${years}-year average` : "Annual wages",
      detail: years > 1 ? `${formatMoney(total)} ÷ ${years} years` : `Single year`,
      result: round2(annualAvg),
      emphasis: "subtotal",
    });
    const monthly = annualAvg / 12;
    steps.push({
      label: "Monthly qualifying income",
      detail: `${formatMoney(annualAvg)} ÷ 12 months`,
      result: round2(monthly),
    });
    return result(w2TwoYearAverage.id, w2TwoYearAverage.label, monthly, steps);
  },
};

const w2CurrentYear: MethodDef = {
  id: "w2_current",
  label: "Current Year W-2 (Box 1 ÷ 12)",
  module: "income",
  appliesTo: ["W2"],
  blurb: "Uses only the most recent W-2's Box 1 wages.",
  compute: (docs) => {
    const w2s = docs.filter((d) => d.docType === "W2");
    const latest = w2s[w2s.length - 1];
    const wages = latest ? num(latest.fields.find((x) => x.label.includes("Box 1"))) : 0;
    const monthly = wages / 12;
    const steps: CalcStep[] = [
      {
        label: "Box 1 wages · most recent year",
        detail: latest ? `${latest.periodLabel}` : "No W-2 found",
        result: wages,
      },
      {
        label: "Monthly qualifying income",
        detail: `${formatMoney(wages)} ÷ 12 months`,
        result: round2(monthly),
      },
    ];
    return result(w2CurrentYear.id, w2CurrentYear.label, monthly, steps);
  },
};

const paystubYtd: MethodDef = {
  id: "paystub_ytd",
  label: "Paystub YTD Annualized",
  module: "income",
  appliesTo: ["Paystub"],
  blurb: "Annualizes year-to-date gross by the number of months elapsed.",
  compute: (docs) => {
    const stub = docs.find((d) => d.docType === "Paystub");
    const ytd = num(findField(docs, "YTD Gross"));
    const months = stub ? monthsElapsedFrom(stub.periodLabel) : 12;
    const monthly = months ? ytd / months : 0;
    const steps: CalcStep[] = [
      {
        label: "YTD gross",
        detail: stub ? `Through ${stub.periodLabel.replace("Period ending ", "")}` : "No paystub",
        result: ytd,
      },
      {
        label: "Months elapsed",
        detail: `Pay period implies ${months} month${months === 1 ? "" : "s"}`,
        result: months,
      },
      {
        label: "Monthly qualifying income",
        detail: `${formatMoney(ytd)} ÷ ${months} months`,
        result: round2(monthly),
      },
    ];
    return result(paystubYtd.id, paystubYtd.label, monthly, steps);
  },
};

const schCWithAddbacks: MethodDef = {
  id: "sch_c_addbacks",
  label: "Self-Employed, Schedule C with add-backs",
  module: "income",
  appliesTo: ["ScheduleC"],
  blurb: "Net profit plus depreciation, home-office, and meals add-backs, ÷ 12.",
  compute: (docs) => {
    const net = num(findField(docs, "Net Profit"));
    const depreciation = num(findField(docs, "Depreciation", "ScheduleC"));
    const home = num(findField(docs, "Business Use of Home"));
    const meals = num(findField(docs, "Meals"));
    const steps: CalcStep[] = [
      { label: "Schedule C net profit", detail: "Line 31", result: net },
      { label: "+ Depreciation", detail: "Line 13 (non-cash add-back)", result: depreciation },
      { label: "+ Business use of home", detail: "Line 30 (add-back)", result: home },
      { label: "+ Meals (50% disallowed)", detail: "Line 24b (add-back)", result: meals },
    ];
    const annual = net + depreciation + home + meals;
    steps.push({
      label: "Adjusted annual income",
      detail: `${formatMoney(net)} + add-backs ${formatMoney(depreciation + home + meals)}`,
      result: round2(annual),
      emphasis: "subtotal",
    });
    const monthly = annual / 12;
    steps.push({
      label: "Monthly qualifying income",
      detail: `${formatMoney(annual)} ÷ 12 months`,
      result: round2(monthly),
    });
    return result(schCWithAddbacks.id, schCWithAddbacks.label, monthly, steps);
  },
};

const k1Income: MethodDef = {
  id: "k1_income",
  label: "K-1 Ordinary Income + Guaranteed Payments",
  module: "income",
  appliesTo: ["K1"],
  blurb: "Box 1 ordinary income plus Box 4 guaranteed payments, ÷ 12.",
  compute: (docs) => {
    const ordinary = num(findField(docs, "Ordinary Business Income"));
    const guaranteed = num(findField(docs, "Guaranteed Payments"));
    const annual = ordinary + guaranteed;
    const monthly = annual / 12;
    const steps: CalcStep[] = [
      { label: "Box 1 — ordinary business income", detail: "Partner's share", result: ordinary },
      { label: "+ Box 4 — guaranteed payments", detail: "Guaranteed to partner", result: guaranteed },
      {
        label: "Adjusted annual income",
        detail: `${formatMoney(ordinary)} + ${formatMoney(guaranteed)}`,
        result: round2(annual),
        emphasis: "subtotal",
      },
      {
        label: "Monthly qualifying income",
        detail: `${formatMoney(annual)} ÷ 12 months`,
        result: round2(monthly),
      },
    ];
    return result(k1Income.id, k1Income.label, monthly, steps);
  },
};

/* ---------------------- Bank statement INCOME methods ---------------------- */
// Non-QM: qualifying income from N months of bank statements. Sum each month's
// eligible deposits (group "Deposits", not excluded, incl. manual lines), divide
// by the number of months. Business variants apply an expense factor.

function depositTotal(doc: DocumentRecord): number {
  return doc.fields
    .filter((x) => x.group === "Deposits" && !x.excluded)
    .reduce((sum, x) => sum + asNumber(x.value), 0);
}

function bankStatementIncome(id: string, label: string, expenseFactor: number): MethodDef {
  const pct = Math.round(expenseFactor * 100);
  return {
    id,
    label,
    module: "income",
    appliesTo: ["BankStatement"],
    blurb:
      expenseFactor > 0
        ? `Averages eligible monthly deposits across all statements, then applies a ${pct}% expense factor.`
        : "Averages eligible monthly deposits across all statements.",
    compute: (docs) => {
      const stmts = docs.filter((d) => d.docType === "BankStatement");
      const months = stmts.length || 1;
      const steps: CalcStep[] = [];
      let total = 0;
      stmts.forEach((d) => {
        const eligible = depositTotal(d);
        total += eligible;
        const n = d.fields.filter((x) => x.group === "Deposits" && !x.excluded).length;
        steps.push({
          label: d.periodLabel,
          detail: `${n} eligible deposit${n === 1 ? "" : "s"}`,
          result: round2(eligible),
        });
      });
      steps.push({
        label: "Total eligible deposits",
        detail: `${months} month${months === 1 ? "" : "s"}`,
        result: round2(total),
        emphasis: "subtotal",
      });

      let adjusted = total;
      if (expenseFactor > 0) {
        const expense = total * expenseFactor;
        adjusted = total - expense;
        steps.push({
          label: `− ${pct}% expense factor`,
          detail: "Business expense allowance",
          result: -round2(expense),
          emphasis: "flag",
        });
        steps.push({
          label: "Net deposits after expenses",
          detail: `${formatMoney(total)} × ${100 - pct}%`,
          result: round2(adjusted),
          emphasis: "subtotal",
        });
      }

      const monthly = adjusted / months;
      steps.push({
        label: "Monthly qualifying income",
        detail: `${formatMoney(adjusted)} ÷ ${months} months`,
        result: round2(monthly),
      });
      return result(id, label, monthly, steps);
    },
  };
}

const bankIncomePersonal = bankStatementIncome(
  "bank_income_personal",
  "Bank Statements — Personal (avg deposits)",
  0,
);
const bankIncomeBusiness50 = bankStatementIncome(
  "bank_income_business_50",
  "Bank Statements — Business (50% expense factor)",
  0.5,
);

/* ----------------------------- ASSET methods ------------------------------ */

const avgBalance: MethodDef = {
  id: "avg_balance",
  label: "Average Daily Balance",
  module: "asset",
  appliesTo: ["BankStatement"],
  blurb: "Sums average daily balances across deposit accounts.",
  compute: (docs) => {
    const balances = findAll(docs, "Average Daily Balance");
    const steps: CalcStep[] = balances.map((b) => ({
      label: "Average daily balance",
      detail: b.provenance,
      result: asNumber(b.value),
    }));
    const total = balances.reduce((a, b) => a + asNumber(b.value), 0);
    steps.push({
      label: "Total qualifying assets",
      detail: `${balances.length} account${balances.length === 1 ? "" : "s"}`,
      result: round2(total),
      emphasis: "subtotal",
    });
    return result(avgBalance.id, avgBalance.label, total, steps);
  },
};

const endingBalance: MethodDef = {
  id: "ending_balance",
  label: "Ending Balance",
  module: "asset",
  appliesTo: ["BankStatement"],
  blurb: "Sums statement ending balances across deposit accounts.",
  compute: (docs) => {
    const balances = findAll(docs, "Ending Balance");
    const steps: CalcStep[] = balances.map((b) => ({
      label: "Ending balance",
      detail: b.provenance,
      result: asNumber(b.value),
    }));
    const total = balances.reduce((a, b) => a + asNumber(b.value), 0);
    steps.push({
      label: "Total qualifying assets",
      detail: `${balances.length} account${balances.length === 1 ? "" : "s"}`,
      result: round2(total),
      emphasis: "subtotal",
    });
    return result(endingBalance.id, endingBalance.label, total, steps);
  },
};

const largeDepositNet: MethodDef = {
  id: "large_deposit_net",
  label: "Ending Balance, Net of Large Deposits",
  module: "asset",
  appliesTo: ["BankStatement"],
  blurb: "Removes flagged large deposits as unsourced funds.",
  compute: (docs) => {
    const ending = findAll(docs, "Ending Balance").reduce((a, b) => a + asNumber(b.value), 0);
    const flags = findAll(docs, "Large Deposit");
    const steps: CalcStep[] = [
      { label: "Ending balance (all accounts)", detail: "Starting point", result: round2(ending) },
    ];
    let net = ending;
    flags.forEach((flag) => {
      const amt = asNumber(flag.value);
      net -= amt;
      steps.push({
        label: `− Flagged: ${flag.label.replace(/^Large Deposit /, "")}`,
        detail: "Large deposit, source not documented",
        result: -amt,
        emphasis: "flag",
      });
    });
    steps.push({
      label: "Net qualifying assets",
      detail: `${formatMoney(ending)} − flagged ${formatMoney(ending - net)}`,
      result: round2(net),
      emphasis: "subtotal",
    });
    return result(largeDepositNet.id, largeDepositNet.label, net, steps);
  },
};

function retirementHaircut(rate: number): MethodDef {
  const pct = Math.round(rate * 100);
  return {
    id: `retirement_haircut_${pct}`,
    label: `Retirement Haircut (${pct}%)`,
    module: "asset",
    appliesTo: ["InvestmentStatement"],
    blurb: `Applies a ${pct}% factor to vested retirement balances, net of loans.`,
    compute: (docs) => {
      const vested = num(findField(docs, "Vested Balance"));
      const loan = num(findField(docs, "Outstanding Loan"));
      const base = vested - loan;
      const eligible = base * rate;
      const steps: CalcStep[] = [
        { label: "Vested balance", detail: "Retirement account", result: vested },
        { label: "− Outstanding loan against account", detail: "Reduces accessible funds", result: -loan, emphasis: "flag" },
        { label: "Net vested balance", detail: `${formatMoney(vested)} − ${formatMoney(loan)}`, result: round2(base), emphasis: "subtotal" },
        {
          label: `× ${pct}% liquidation factor`,
          detail: `Accounts for taxes & penalties on early access`,
          result: round2(eligible),
        },
        { label: "Eligible retirement assets", detail: `${formatNumber(pct)}% of net vested`, result: round2(eligible), emphasis: "subtotal" },
      ];
      return result(`retirement_haircut_${pct}`, `Retirement Haircut (${pct}%)`, eligible, steps);
    },
  };
}

const retirement60 = retirementHaircut(0.6);
const retirement70 = retirementHaircut(0.7);

/* ------------------------------- DSCR methods ----------------------------- */
// Debt Service Coverage Ratio for investment property: rent ÷ PITIA debt
// service. Result is a ratio (e.g. 1.27), not a dollar amount.

const PITIA_GROUP = "Debt service (PITIA)";

function pitiaTotal(docs: DocumentRecord[]): number {
  return allFields(docs)
    .filter((x) => x.group === PITIA_GROUP && !x.excluded)
    .reduce((a, x) => a + asNumber(x.value), 0);
}
function pitiaSteps(docs: DocumentRecord[]): CalcStep[] {
  return allFields(docs)
    .filter((x) => x.group === PITIA_GROUP && !x.excluded)
    .map((x) => ({ label: `· ${x.label}`, detail: "monthly", result: asNumber(x.value) }));
}

function dscrFrom(id: string, label: string, rent: number, rentLabel: string, docs: DocumentRecord[]): CalculationResult {
  const debt = pitiaTotal(docs);
  const ratio = debt ? rent / debt : 0;
  const steps: CalcStep[] = [
    { label: rentLabel, detail: "Gross monthly rent", result: round2(rent) },
    ...pitiaSteps(docs),
    { label: "Total PITIA debt service", detail: "Principal, interest, taxes, insurance, HOA", result: round2(debt), emphasis: "subtotal" },
    {
      label: "DSCR = rent ÷ PITIA",
      detail: `${formatMoney(rent)} ÷ ${formatMoney(debt)}`,
      result: round2(ratio),
      unit: "ratio",
      emphasis: "subtotal",
    },
  ];
  return { method: id, methodLabel: label, monthlyQualifying: round2(ratio), steps };
}

const dscrLease: MethodDef = {
  id: "dscr_lease",
  label: "DSCR — Lease Rent ÷ PITIA",
  module: "dscr",
  appliesTo: ["LeaseAgreement", "OperatingStatement"],
  blurb: "In-place lease rent divided by monthly PITIA debt service.",
  compute: (docs) => dscrFrom(dscrLease.id, dscrLease.label, num(findField(docs, "Monthly Rent")), "Lease rent", docs),
};

const dscrMarket: MethodDef = {
  id: "dscr_market",
  label: "DSCR — Market Rent (1007) ÷ PITIA",
  module: "dscr",
  appliesTo: ["RentSchedule", "OperatingStatement"],
  blurb: "Form 1007 market rent divided by monthly PITIA debt service.",
  compute: (docs) => dscrFrom(dscrMarket.id, dscrMarket.label, num(findField(docs, "Market Rent")), "Market rent (1007)", docs),
};

const dscrNet: MethodDef = {
  id: "dscr_net",
  label: "DSCR — Vacancy-adjusted ÷ PITIA",
  module: "dscr",
  appliesTo: ["LeaseAgreement", "OperatingStatement"],
  blurb: "Lease rent less a vacancy factor, divided by monthly PITIA.",
  compute: (docs) => {
    const gross = num(findField(docs, "Monthly Rent"));
    const vacField = findField(docs, "Vacancy");
    const vac = vacField ? asNumber(vacField.value) / 100 : 0;
    const effective = gross * (1 - vac);
    const debt = pitiaTotal(docs);
    const ratio = debt ? effective / debt : 0;
    const steps: CalcStep[] = [
      { label: "Gross monthly rent", detail: "Lease", result: round2(gross) },
      { label: `− Vacancy factor ${Math.round(vac * 100)}%`, detail: "Underwriting assumption", result: -round2(gross * vac), emphasis: "flag" },
      { label: "Effective rent", detail: `${formatMoney(gross)} × ${100 - Math.round(vac * 100)}%`, result: round2(effective), emphasis: "subtotal" },
      ...pitiaSteps(docs),
      { label: "Total PITIA debt service", detail: "Monthly", result: round2(debt), emphasis: "subtotal" },
      { label: "DSCR = effective rent ÷ PITIA", detail: `${formatMoney(effective)} ÷ ${formatMoney(debt)}`, result: round2(ratio), unit: "ratio", emphasis: "subtotal" },
    ];
    return { method: dscrNet.id, methodLabel: dscrNet.label, monthlyQualifying: round2(ratio), steps };
  },
};

/* ------------------------------- registry --------------------------------- */

export const INCOME_METHODS: MethodDef[] = [
  w2TwoYearAverage,
  w2CurrentYear,
  paystubYtd,
  schCWithAddbacks,
  k1Income,
  bankIncomePersonal,
  bankIncomeBusiness50,
];

export const ASSET_METHODS: MethodDef[] = [
  avgBalance,
  endingBalance,
  largeDepositNet,
  retirement60,
  retirement70,
];

export const DSCR_METHODS: MethodDef[] = [dscrLease, dscrMarket, dscrNet];

const ALL_METHODS = [...INCOME_METHODS, ...ASSET_METHODS, ...DSCR_METHODS];

function moduleMethods(module: ModuleKind): MethodDef[] {
  if (module === "income") return INCOME_METHODS;
  if (module === "asset") return ASSET_METHODS;
  return DSCR_METHODS;
}

/* ----------------------- Admin-defined custom methods --------------------- */
// Parameterized method templates an admin can create/edit in Settings. The
// `factorPct` meaning depends on the kind. These are registered at runtime from
// tenant config (configureCustomMethods) so they behave like built-in methods.

export const CUSTOM_METHOD_KINDS: {
  id: CustomMethodKind;
  label: string;
  module: ModuleKind;
  appliesTo: DocType[];
  factorLabel: string;
  factorHint: string;
  defaultFactor: number;
}[] = [
  {
    id: "bank_income_factor",
    label: "Bank-statement income (expense factor)",
    module: "income",
    appliesTo: ["BankStatement"],
    factorLabel: "Expense factor %",
    factorHint: "Share of deposits treated as business expenses.",
    defaultFactor: 50,
  },
  {
    id: "asset_balance_factor",
    label: "Deposit balance factor",
    module: "asset",
    appliesTo: ["BankStatement"],
    factorLabel: "Balance factor %",
    factorHint: "Share of average daily balance counted as assets.",
    defaultFactor: 100,
  },
  {
    id: "asset_haircut",
    label: "Retirement haircut",
    module: "asset",
    appliesTo: ["InvestmentStatement"],
    factorLabel: "Liquidation factor %",
    factorHint: "Share of net vested balance counted after taxes/penalties.",
    defaultFactor: 70,
  },
];

function kindMeta(kind: CustomMethodKind) {
  return CUSTOM_METHOD_KINDS.find((k) => k.id === kind) ?? CUSTOM_METHOD_KINDS[0];
}

function computeCustom(cm: CustomMethod, docs: DocumentRecord[]): CalculationResult {
  if (cm.kind === "formula") {
    const r = evaluateFormula(cm.formula ?? "", docs);
    return { method: cm.id, methodLabel: cm.label, monthlyQualifying: r.value, steps: r.steps };
  }
  const f = cm.factorPct / 100;
  if (cm.kind === "bank_income_factor") {
    const stmts = docs.filter((d) => d.docType === "BankStatement");
    const months = stmts.length || 1;
    const steps: CalcStep[] = [];
    let total = 0;
    stmts.forEach((d) => {
      const eligible = d.fields
        .filter((x) => x.group === "Deposits" && !x.excluded)
        .reduce((s, x) => s + asNumber(x.value), 0);
      total += eligible;
      steps.push({ label: d.periodLabel, detail: "eligible deposits", result: round2(eligible) });
    });
    steps.push({ label: "Total eligible deposits", detail: `${months} months`, result: round2(total), emphasis: "subtotal" });
    const adjusted = total * (1 - f);
    steps.push({ label: `− ${cm.factorPct}% expense factor`, detail: "Business expense allowance", result: -round2(total * f), emphasis: "flag" });
    const monthly = adjusted / months;
    steps.push({ label: "Monthly qualifying income", detail: `${formatMoney(adjusted)} ÷ ${months} months`, result: round2(monthly) });
    return result(cm.id, cm.label, monthly, steps);
  }
  if (cm.kind === "asset_balance_factor") {
    const balances = findAll(docs, "Average Daily Balance");
    const steps: CalcStep[] = balances.map((b) => ({ label: "Average daily balance", detail: b.provenance, result: asNumber(b.value) }));
    const total = balances.reduce((a, b) => a + asNumber(b.value), 0);
    const eligible = total * f;
    steps.push({ label: `× ${cm.factorPct}% balance factor`, detail: "Counted as assets", result: round2(eligible), emphasis: "subtotal" });
    return result(cm.id, cm.label, eligible, steps);
  }
  // asset_haircut
  const vested = num(findField(docs, "Vested Balance"));
  const loan = num(findField(docs, "Outstanding Loan"));
  const base = vested - loan;
  const eligible = base * f;
  const steps: CalcStep[] = [
    { label: "Vested balance", detail: "Retirement account", result: vested },
    { label: "− Outstanding loan", detail: "Reduces accessible funds", result: -loan, emphasis: "flag" },
    { label: "Net vested balance", detail: `${formatMoney(vested)} − ${formatMoney(loan)}`, result: round2(base), emphasis: "subtotal" },
    { label: `× ${cm.factorPct}% liquidation factor`, detail: "After taxes & penalties", result: round2(eligible), emphasis: "subtotal" },
  ];
  return result(cm.id, cm.label, eligible, steps);
}

function buildCustomMethod(cm: CustomMethod): MethodDef {
  if (cm.kind === "formula") {
    return {
      id: cm.id,
      label: cm.label,
      module: cm.module,
      appliesTo: undefined, // formula methods apply to any document in the module
      blurb: `Formula · ${cm.formula ?? ""}`,
      compute: (docs) => computeCustom(cm, docs),
    };
  }
  const meta = kindMeta(cm.kind);
  return {
    id: cm.id,
    label: cm.label,
    module: cm.module,
    appliesTo: meta.appliesTo,
    blurb: `${meta.label} · ${meta.factorLabel} ${cm.factorPct}%. ${meta.factorHint}`,
    compute: (docs) => computeCustom(cm, docs),
  };
}

// Representative formulas for the built-in methods, so an admin can fork any of
// them into an editable custom formula ("Duplicate as editable formula").
export const BUILTIN_FORMULA: Record<string, string> = {
  w2_2yr_avg: 'sum("Box 1 — Wages") / 12',
  w2_current: 'sum("Box 1 — Wages") / 12',
  paystub_ytd: 'sum("YTD Gross") / 5',
  sch_c_addbacks:
    '(sum("Net Profit") + sum("Depreciation") + sum("Business Use of Home") + sum("Meals")) / 12',
  k1_income: '(sum("Ordinary Business Income") + sum("Guaranteed Payments")) / 12',
  bank_income_personal: 'sum("Deposits") / months',
  bank_income_business_50: 'sum("Deposits") * 0.5 / months',
  avg_balance: 'sum("Average Daily Balance")',
  ending_balance: 'sum("Ending Balance")',
  large_deposit_net: 'sum("Ending Balance") - sum("Large Deposit")',
  retirement_haircut_60: '(sum("Vested Balance") - sum("Outstanding Loan")) * 0.6',
  retirement_haircut_70: '(sum("Vested Balance") - sum("Outstanding Loan")) * 0.7',
  dscr_lease: 'sum("Monthly Rent") / sum("Debt service (PITIA)")',
  dscr_market: 'sum("Market Rent") / sum("Debt service (PITIA)")',
  dscr_net: 'sum("Monthly Rent") * 0.95 / sum("Debt service (PITIA)")',
};

// Runtime registry populated from tenant config (Settings).
let customMethods: MethodDef[] = [];
let labelOverrides: Record<string, string> = {};

export function configureCustomMethods(cms: CustomMethod[], overrides: Record<string, string>): void {
  customMethods = cms.filter((c) => c.enabled).map(buildCustomMethod);
  labelOverrides = overrides ?? {};
}

function withLabel(m: MethodDef): MethodDef {
  const ov = labelOverrides[m.id];
  return ov ? { ...m, label: ov } : m;
}

function findAnyMethod(id: string): MethodDef | undefined {
  return [...ALL_METHODS, ...customMethods].find((m) => m.id === id);
}

// Methods for a module, optionally filtered to those relevant to the documents
// present (so a bank-statement income analysis shows bank-statement methods,
// not W-2 methods, and vice versa). Includes admin-defined custom methods.
export function getMethodsForModule(module: ModuleKind, docs?: DocumentRecord[]): MethodDef[] {
  const base = moduleMethods(module);
  const all = [...base, ...customMethods.filter((m) => m.module === module)];
  let list = all;
  if (docs && docs.length > 0) {
    const types = new Set(docs.map((d) => d.docType));
    const relevant = all.filter((m) => !m.appliesTo || m.appliesTo.some((t) => types.has(t)));
    if (relevant.length > 0) list = relevant;
  }
  return list.map(withLabel);
}

export function getMethod(id: string): MethodDef | undefined {
  const m = findAnyMethod(id);
  return m ? withLabel(m) : undefined;
}

// Pick a sensible default method given the documents present.
export function defaultMethodFor(module: ModuleKind, docs: DocumentRecord[]): string {
  const types = new Set(docs.map((d) => d.docType));
  if (module === "income") {
    if (types.has("W2")) return w2TwoYearAverage.id;
    if (types.has("ScheduleC")) return schCWithAddbacks.id;
    if (types.has("K1")) return k1Income.id;
    if (types.has("Paystub")) return paystubYtd.id;
    if (types.has("BankStatement")) return bankIncomePersonal.id;
    return w2TwoYearAverage.id;
  }
  if (module === "dscr") {
    if (types.has("LeaseAgreement")) return dscrLease.id;
    if (types.has("RentSchedule")) return dscrMarket.id;
    return dscrLease.id;
  }
  if (types.has("InvestmentStatement") && !types.has("BankStatement")) return retirement60.id;
  return avgBalance.id;
}

/* ------------------------------ guidelines -------------------------------- */
// Agency + investor guideline overlays. The selector is LIVE (you can pick one)
// but the overlay math is not yet wired — production layers these rule sets on
// top of the base method (DTI caps, add-back eligibility, reserve requirements,
// doc-type allowances, etc.) inside the versioned, per-tenant rules engine.

export interface GuidelineOption {
  id: string;
  label: string;
}

export const GUIDELINE_GROUPS: { group: string; options: GuidelineOption[] }[] = [
  {
    group: "Agency",
    options: [
      { id: "fnma", label: "Fannie Mae — Conventional" },
      { id: "fhlmc", label: "Freddie Mac — Conventional" },
      { id: "fha", label: "FHA" },
      { id: "va", label: "VA" },
      { id: "usda", label: "USDA Rural" },
    ],
  },
  {
    group: "Non-QM investors",
    options: [
      { id: "angeloak", label: "Angel Oak Mortgage Solutions" },
      { id: "deephaven", label: "Deephaven Mortgage" },
      { id: "verus", label: "Verus Mortgage Capital" },
      { id: "acra", label: "Acra Lending" },
      { id: "carrington", label: "Carrington Mortgage Services" },
    ],
  },
];

export function getGuidelineLabel(id?: string): string | undefined {
  if (!id) return undefined;
  for (const g of GUIDELINE_GROUPS) {
    const hit = g.options.find((o) => o.id === id);
    if (hit) return hit.label;
  }
  return undefined;
}

/**
 * MOCK calculation entry point. Production swaps this for the real rules engine
 * call (versioned + per-tenant). The returned `steps[]` are the audit lineage.
 */
export function runCalculation(docs: DocumentRecord[], methodId: string): CalculationResult {
  const method = findAnyMethod(methodId);
  if (!method) {
    return result("none", "No method selected", 0, []);
  }
  const res = method.compute(docs);
  // Reflect any admin rename in the stored/displayed method label.
  res.methodLabel = labelOverrides[method.id] ?? res.methodLabel;
  return res;
}
