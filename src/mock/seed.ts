/* =============================================================================
 * SEED DATA  (MOCK)
 * -----------------------------------------------------------------------------
 * Sample analyses used to populate localStorage on first run. Covers a range of
 * cases so the confidence color-coding, override behavior, and lineage are all
 * visible immediately. All names / numbers are synthetic.
 * ========================================================================== */

import type { Analysis, AnalysisStatus, DocType, ModuleKind, Note } from "../types";
import { extractDocumentSync, extractBankStatementBundle } from "./extraction";
import { defaultMethodFor, runCalculation } from "./rules";
import { uid } from "../lib/id";

export const MOCK_USER = "Andrew Cole";

function daysAgoISO(days: number, hour = 10, minute = 15): string {
  const d = new Date("2026-06-18T00:00:00");
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function mkNote(daysAgo: number, body: string, author = MOCK_USER): Note {
  return { id: uid("note"), author, timestamp: daysAgoISO(daysAgo, 14, 22), body };
}

interface Override {
  labelIncludes: string;
  value: string | number;
}

interface SeedSpec {
  loanNumber: string;
  module: ModuleKind;
  borrowerName: string;
  status: AnalysisStatus;
  docTypes: DocType[];
  daysAgo: number; // days since last update
  createdOffset?: number; // extra days between creation and last update
  overrides?: Override[];
  methodId?: string;
  computed?: boolean;
  notes?: Note[];
}

function build(spec: SeedSpec): Analysis {
  const documents = spec.docTypes.map((t) => extractDocumentSync(t));

  // Apply seed overrides so the dashboard shows real override state.
  (spec.overrides ?? []).forEach((ov) => {
    for (const doc of documents) {
      const field = doc.fields.find((x) =>
        x.label.toLowerCase().includes(ov.labelIncludes.toLowerCase()),
      );
      if (field) {
        field.value = ov.value;
        field.overridden = true;
        break;
      }
    }
  });

  const method = spec.methodId ?? defaultMethodFor(spec.module, documents);
  const result =
    spec.computed || spec.status === "calculated" || spec.status === "finalized"
      ? runCalculation(documents, method)
      : undefined;

  return {
    id: uid("ana"),
    loanNumber: spec.loanNumber,
    module: spec.module,
    borrowerName: spec.borrowerName,
    status: spec.status,
    documents,
    method,
    result,
    notes: spec.notes ?? [],
    createdAt: daysAgoISO(spec.daysAgo + (spec.createdOffset ?? 2), 9),
    updatedAt: daysAgoISO(spec.daysAgo, 11, 40),
  };
}

// A 12-month bank-statement income case (Non-QM), built directly since it holds
// many monthly documents rather than a single canonical doc.
function bankStatementIncomeSeed(): Analysis {
  const documents = extractBankStatementBundle(12);
  const method = "bank_income_personal";
  return {
    id: uid("ana"),
    loanNumber: "LN-2026-00501",
    module: "income",
    borrowerName: "Jordan Avery",
    status: "in_review",
    documents,
    method,
    result: runCalculation(documents, method),
    notes: [
      mkNote(2, "12 months of personal bank statements. Large wire transfers excluded pending source docs; review each month's deposits."),
    ],
    createdAt: daysAgoISO(6, 9),
    updatedAt: daysAgoISO(2, 11, 40),
  };
}

export function buildSeedAnalyses(): Analysis[] {
  return [
    bankStatementIncomeSeed(),
    // --- INCOME: clean salaried, high confidence -------------------------- //
    build({
      loanNumber: "LN-2026-00471",
      module: "income",
      borrowerName: "Robert Martinez",
      status: "calculated",
      docTypes: ["W2", "W2", "Paystub"],
      daysAgo: 1,
      createdOffset: 3,
      methodId: "w2_2yr_avg",
      notes: [
        mkNote(1, "Two years of W-2s present and consistent. Paystub corroborates current run rate."),
      ],
    }),

    // --- INCOME: self-employed, mixed/low confidence ---------------------- //
    build({
      loanNumber: "LN-2026-00488",
      module: "income",
      borrowerName: "Dana Whitfield",
      status: "in_review",
      docTypes: ["1040", "ScheduleC", "K1"],
      daysAgo: 3,
      createdOffset: 5,
      methodId: "sch_c_addbacks",
      overrides: [{ labelIncludes: "Meals", value: 1280 }],
      notes: [
        mkNote(4, "K-1 box 4 and 19 are low confidence — image was skewed. Flag for second review."),
        mkNote(3, "Adjusted meals add-back down to documented amount per CPA letter."),
      ],
    }),

    // --- INCOME: hourly wage earner, draft -------------------------------- //
    build({
      loanNumber: "LN-2026-00492",
      module: "income",
      borrowerName: "Latoya Brooks",
      status: "draft",
      docTypes: ["Paystub"],
      daysAgo: 0,
      methodId: "paystub_ytd",
    }),

    // --- INCOME: finalized salaried --------------------------------------- //
    build({
      loanNumber: "LN-2026-00450",
      module: "income",
      borrowerName: "Marcus Lee",
      status: "finalized",
      docTypes: ["W2", "W2"],
      daysAgo: 4,
      createdOffset: 2,
      methodId: "w2_2yr_avg",
      overrides: [{ labelIncludes: "Box 1", value: 85000 }],
      notes: [mkNote(9, "Finalized. Income supports qualifying ratio. Locked.")],
    }),

    // --- ASSET: bank + retirement, high/medium ---------------------------- //
    build({
      loanNumber: "LN-2026-00477",
      module: "asset",
      borrowerName: "Priya Nair",
      status: "calculated",
      docTypes: ["BankStatement", "InvestmentStatement"],
      daysAgo: 2,
      methodId: "avg_balance",
      notes: [
        mkNote(2, "Two large deposits in May flagged. Awaiting source documentation from borrower."),
      ],
    }),

    // --- ASSET: retirement haircut focus ---------------------------------- //
    build({
      loanNumber: "LN-2026-00481",
      module: "asset",
      borrowerName: "Priya Nair",
      status: "in_review",
      docTypes: ["InvestmentStatement"],
      daysAgo: 5,
      createdOffset: 4,
      methodId: "retirement_haircut_60",
    }),

    // --- ASSET: deposits only, draft -------------------------------------- //
    build({
      loanNumber: "LN-2026-00495",
      module: "asset",
      borrowerName: "Greg Tanaka",
      status: "draft",
      docTypes: ["BankStatement"],
      daysAgo: 0,
      methodId: "large_deposit_net",
    }),

    // --- ASSET: finalized -------------------------------------------------- //
    build({
      loanNumber: "LN-2026-00442",
      module: "asset",
      borrowerName: "Helen Okafor",
      status: "finalized",
      docTypes: ["BankStatement", "InvestmentStatement"],
      daysAgo: 12,
      createdOffset: 6,
      methodId: "ending_balance",
      notes: [mkNote(12, "Reserves verified. 6 months PITI covered. Locked.")],
    }),
  ];
}
