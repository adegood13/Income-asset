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
  DocumentRecord,
  ModuleKind,
} from "../types";
import { asNumber, formatMoney, formatNumber } from "../lib/format";

interface MethodDef {
  id: string;
  label: string;
  module: ModuleKind;
  // Short note shown under the method dropdown.
  blurb: string;
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

/* ----------------------------- ASSET methods ------------------------------ */

const avgBalance: MethodDef = {
  id: "avg_balance",
  label: "Average Daily Balance",
  module: "asset",
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

/* ------------------------------- registry --------------------------------- */

export const INCOME_METHODS: MethodDef[] = [
  w2TwoYearAverage,
  w2CurrentYear,
  paystubYtd,
  schCWithAddbacks,
  k1Income,
];

export const ASSET_METHODS: MethodDef[] = [
  avgBalance,
  endingBalance,
  largeDepositNet,
  retirement60,
  retirement70,
];

const ALL_METHODS = [...INCOME_METHODS, ...ASSET_METHODS];

export function getMethodsForModule(module: ModuleKind): MethodDef[] {
  return module === "income" ? INCOME_METHODS : ASSET_METHODS;
}

export function getMethod(id: string): MethodDef | undefined {
  return ALL_METHODS.find((m) => m.id === id);
}

// Pick a sensible default method given the documents present.
export function defaultMethodFor(module: ModuleKind, docs: DocumentRecord[]): string {
  const types = new Set(docs.map((d) => d.docType));
  if (module === "income") {
    if (types.has("W2")) return w2TwoYearAverage.id;
    if (types.has("ScheduleC")) return schCWithAddbacks.id;
    if (types.has("K1")) return k1Income.id;
    if (types.has("Paystub")) return paystubYtd.id;
    return w2TwoYearAverage.id;
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
  const method = getMethod(methodId);
  if (!method) {
    return result("none", "No method selected", 0, []);
  }
  return method.compute(docs);
}
