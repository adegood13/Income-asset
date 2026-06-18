/* =============================================================================
 * SEAM 1 — DOCUMENT EXTRACTION  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with calls to the real extraction API
 * (document classification + field extraction + per-field confidence).
 *
 * Here we return pre-baked `DocumentRecord`s with realistic-but-fake values and
 * hand-tuned confidence scores so the assist-mode UI has something to render.
 * `extractDocument()` simulates latency and hands back a fresh copy (new ids)
 * so the same canonical doc can be "uploaded" repeatedly.
 *
 * All values here are obviously synthetic. No real SSNs / account numbers.
 * ========================================================================== */

import type { CapturedField, DocType, DocumentRecord, FieldType } from "../types";
import { uid } from "../lib/id";

// Small builder so the canonical docs below stay readable.
function f(
  label: string,
  value: string | number,
  type: FieldType,
  confidence: number,
  provenance: string,
  group: string,
): CapturedField {
  return {
    id: uid("fld"),
    label,
    value,
    originalValue: value,
    type,
    confidence,
    provenance,
    overridden: false,
    group,
  };
}

// Average a doc's field confidences into an overall score.
function overall(fields: CapturedField[]): number {
  if (!fields.length) return 0;
  const sum = fields.reduce((a, b) => a + b.confidence, 0);
  return Math.round(sum / fields.length);
}

function doc(docType: DocType, periodLabel: string, fields: CapturedField[]): DocumentRecord {
  return {
    id: uid("doc"),
    docType,
    periodLabel,
    fields,
    overallConfidence: overall(fields),
  };
}

/* -------------------------------------------------------------------------- */
/* Canonical INCOME documents                                                 */
/* -------------------------------------------------------------------------- */

function w2(year: string, name: string, ssn: string): DocumentRecord {
  return doc("W2", `Tax Year ${year}`, [
    f("Employee Name", name, "identifier", 99, `W-2 ${year}, employee box`, "Identifiers"),
    f("SSN", ssn, "identifier", 98, `W-2 ${year}, box a`, "Identifiers"),
    f("Employer", "Cascade Logistics Inc.", "text", 97, `W-2 ${year}, box c`, "Identifiers"),
    f("Box 1 — Wages", 84210, "financial", 99, `W-2 ${year}, box 1`, "Income lines"),
    f("Box 3 — Social Security Wages", 86500, "financial", 96, `W-2 ${year}, box 3`, "Income lines"),
    f("Box 5 — Medicare Wages", 86500, "financial", 96, `W-2 ${year}, box 5`, "Income lines"),
    f("Box 12 — Code D (401k)", 2290, "financial", 88, `W-2 ${year}, box 12`, "Income lines"),
  ]);
}

function paystub(period: string, name: string): DocumentRecord {
  return doc("Paystub", period, [
    f("Employee Name", name, "identifier", 96, `Paystub, ${period}`, "Identifiers"),
    f("Pay Frequency", "Bi-weekly", "text", 92, `Paystub, header`, "Income lines"),
    f("Current Gross", 3238.46, "financial", 94, `Paystub, ${period}, current`, "Income lines"),
    f("YTD Gross", 35623.06, "financial", 91, `Paystub, ${period}, YTD`, "Income lines"),
    f("YTD Overtime", 1840.0, "financial", 74, `Paystub, ${period}, OT line`, "Income lines"),
    f("Hourly Rate", 40.48, "financial", 69, `Paystub, rate (smudged)`, "Income lines"),
  ]);
}

function form1040(year: string, name: string, ssn: string): DocumentRecord {
  return doc("1040", `Tax Year ${year}`, [
    f("Taxpayer Name", name, "identifier", 95, `1040 ${year}, p.1`, "Identifiers"),
    f("SSN", ssn, "identifier", 93, `1040 ${year}, p.1`, "Identifiers"),
    f("Line 1a — Wages", 0, "financial", 90, `1040 ${year}, p.1, line 1a`, "Income lines"),
    f("Line 3a — Qualified Dividends", 1420, "financial", 82, `1040 ${year}, p.1, line 3a`, "Income lines"),
    f("Line 8 — Other Income (Sch 1)", 96400, "financial", 71, `1040 ${year}, p.1, line 8`, "Income lines"),
    f("Line 11 — Adjusted Gross Income", 91860, "financial", 86, `1040 ${year}, p.1, line 11`, "Income lines"),
  ]);
}

function scheduleC(year: string): DocumentRecord {
  return doc("ScheduleC", `Tax Year ${year}`, [
    f("Business Name", "Rivera Design Studio", "text", 94, `Sch C ${year}, line C`, "Identifiers"),
    f("Line 1 — Gross Receipts", 184300, "financial", 88, `Sch C ${year}, line 1`, "Income lines"),
    f("Line 28 — Total Expenses", 92740, "financial", 79, `Sch C ${year}, line 28`, "Income lines"),
    f("Line 31 — Net Profit", 91560, "financial", 84, `Sch C ${year}, line 31`, "Income lines"),
    f("Line 13 — Depreciation", 8650, "financial", 76, `Sch C ${year}, line 13`, "Add-backs"),
    f("Line 30 — Business Use of Home", 3120, "financial", 64, `Sch C ${year}, line 30`, "Add-backs"),
    f("Line 24b — Meals (50%)", 1480, "financial", 58, `Sch C ${year}, line 24b`, "Add-backs"),
  ]);
}

function scheduleE(year: string): DocumentRecord {
  return doc("ScheduleE", `Tax Year ${year}`, [
    f("Property — 1420 Birch Ave", "Single-family rental", "text", 90, `Sch E ${year}, line 1a`, "Identifiers"),
    f("Line 3 — Rents Received", 28800, "financial", 87, `Sch E ${year}, line 3`, "Income lines"),
    f("Line 20 — Total Expenses", 19240, "financial", 77, `Sch E ${year}, line 20`, "Income lines"),
    f("Line 18 — Depreciation", 6180, "financial", 72, `Sch E ${year}, line 18`, "Add-backs"),
    f("Line 21 — Net Income/Loss", 9560, "financial", 81, `Sch E ${year}, line 21`, "Income lines"),
  ]);
}

function k1(year: string): DocumentRecord {
  return doc("K1", `Tax Year ${year}`, [
    f("Partnership", "Northgate Holdings LLC", "text", 89, `K-1 ${year}, part II`, "Identifiers"),
    f("Ownership %", 35, "text", 83, `K-1 ${year}, part II, L`, "Identifiers"),
    f("Box 1 — Ordinary Business Income", 41200, "financial", 73, `K-1 ${year}, box 1`, "Income lines"),
    f("Box 4 — Guaranteed Payments", 24000, "financial", 67, `K-1 ${year}, box 4`, "Income lines"),
    f("Box 19 — Distributions", 38000, "financial", 61, `K-1 ${year}, box 19`, "Income lines"),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Canonical ASSET documents                                                  */
/* -------------------------------------------------------------------------- */

function bankStatement(period: string, name: string, acct: string): DocumentRecord {
  return doc("BankStatement", period, [
    f("Account Holder", name, "identifier", 95, `Statement, ${period}, header`, "Identifiers"),
    f("Account Number", acct, "identifier", 92, `Statement, ${period}, header`, "Identifiers"),
    f("Institution", "Harborline Bank", "text", 97, `Statement, ${period}, header`, "Identifiers"),
    f("Beginning Balance", 41280.55, "financial", 96, `Statement, ${period}, p.1`, "Balances"),
    f("Ending Balance", 47930.12, "financial", 96, `Statement, ${period}, p.1`, "Balances"),
    f("Average Daily Balance", 43610.0, "financial", 88, `Statement, ${period}, summary`, "Balances"),
    f("Large Deposit — 05/14", 12500.0, "financial", 70, `Statement, ${period}, p.2`, "Deposits"),
    f("Large Deposit — 05/22", 6200.0, "financial", 66, `Statement, ${period}, p.2`, "Deposits"),
    f("Payroll Deposits (total)", 6476.92, "financial", 90, `Statement, ${period}, p.2`, "Deposits"),
  ]);
}

function investmentStatement(period: string, name: string, acct: string): DocumentRecord {
  return doc("InvestmentStatement", period, [
    f("Account Holder", name, "identifier", 94, `Statement, ${period}, header`, "Identifiers"),
    f("Account Number", acct, "identifier", 90, `Statement, ${period}, header`, "Identifiers"),
    f("Account Type", "401(k) — Retirement", "text", 93, `Statement, ${period}, header`, "Identifiers"),
    f("Total Account Value", 218450.0, "financial", 95, `Statement, ${period}, summary`, "Balances"),
    f("Vested Balance", 201300.0, "financial", 89, `Statement, ${period}, summary`, "Balances"),
    f("Non-vested Balance", 17150.0, "financial", 84, `Statement, ${period}, summary`, "Balances"),
    f("Outstanding Loan Against Account", 9800.0, "financial", 62, `Statement, ${period}, p.3`, "Balances"),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Registry + public API                                                      */
/* -------------------------------------------------------------------------- */

// What the "upload" picker offers per module.
export const INCOME_DOC_TYPES: DocType[] = ["W2", "Paystub", "1040", "ScheduleC", "ScheduleE", "K1"];
export const ASSET_DOC_TYPES: DocType[] = ["BankStatement", "InvestmentStatement"];

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  W2: "W-2 Wage Statement",
  Paystub: "Paystub",
  "1040": "Form 1040",
  ScheduleC: "Schedule C",
  ScheduleE: "Schedule E",
  K1: "Schedule K-1",
  "1120S": "Form 1120-S",
  BankStatement: "Bank Statement",
  InvestmentStatement: "Investment / Retirement Statement",
};

// Build a fresh canonical document of the requested type.
function buildCanonical(docType: DocType): DocumentRecord {
  switch (docType) {
    case "W2":
      return w2("2025", "Robert Martinez", "412-55-8830");
    case "Paystub":
      return paystub("Period ending 05/31/2026", "Robert Martinez");
    case "1040":
      return form1040("2025", "Dana Whitfield", "503-22-7741");
    case "ScheduleC":
      return scheduleC("2025");
    case "ScheduleE":
      return scheduleE("2025");
    case "K1":
      return k1("2025");
    case "BankStatement":
      return bankStatement("Statement 05/01–05/31/2026", "Priya Nair", "000123456789");
    case "InvestmentStatement":
      return investmentStatement("Statement Q1 2026", "Priya Nair", "000987654321");
    case "1120S":
    default:
      // 1120-S is modeled in the type system but not seeded; fall back to K-1 shape.
      return k1("2025");
  }
}

/**
 * MOCK extraction entry point. Simulates upload + OCR + classification latency,
 * then returns a freshly-id'd canonical document. Production swaps this for a
 * real async call to the extraction service.
 */
export function extractDocument(docType: DocType): Promise<DocumentRecord> {
  return new Promise((resolve) => {
    const delay = 850 + Math.random() * 500;
    setTimeout(() => resolve(buildCanonical(docType)), delay);
  });
}

// Synchronous variant used by the seed generator (no artificial latency).
export function extractDocumentSync(docType: DocType): DocumentRecord {
  return buildCanonical(docType);
}
