// Domain types for the AskBob Income & Asset prototype.
// These mirror the shape the real backend is expected to expose so the
// engineering team can swap mocks for services without reshaping the UI.

export type Confidence = number; // 0 to 100

export type FieldType = "identifier" | "financial" | "text";

export interface CapturedField {
  id: string;
  label: string;
  value: string | number;
  originalValue: string | number; // what extraction "captured", before any override
  type: FieldType;
  confidence: Confidence;
  provenance: string; // e.g. "1040 p.1, line 11"
  overridden: boolean;
  note?: string;
  group?: string; // UI grouping: "Identifiers", "Income lines", "Add-backs", etc.
  // Bank-statement income: a deposit excluded from the income calculation
  // (e.g. an inter-account transfer or an undocumented large deposit).
  excluded?: boolean;
  // A line item the reviewer added by hand (not captured by extraction).
  manual?: boolean;
}

export type DocType =
  | "W2"
  | "Paystub"
  | "1040"
  | "ScheduleC"
  | "ScheduleE"
  | "K1"
  | "1120S"
  | "BankStatement"
  | "InvestmentStatement"
  | "LeaseAgreement"
  | "RentSchedule"
  | "OperatingStatement";

export interface DocumentRecord {
  id: string;
  docType: DocType;
  periodLabel: string; // tax year or statement period
  fields: CapturedField[];
  overallConfidence: Confidence;
}

export interface CalcStep {
  label: string;
  detail: string; // e.g. "Box 1 wages 84,000 / 12"
  result: number;
  // Optional flag so the UI can highlight notable lineage rows (e.g. a flag).
  emphasis?: "flag" | "subtotal";
  // How to render `result`. Defaults to money; DSCR uses "ratio".
  unit?: "money" | "ratio" | "percent";
}

export interface CalculationResult {
  method: string; // method id, see rules.ts
  methodLabel: string; // human label
  monthlyQualifying: number;
  steps: CalcStep[];
}

export interface Note {
  id: string;
  author: string;
  timestamp: string;
  body: string;
}

export type AnalysisStatus = "draft" | "in_review" | "calculated" | "finalized";

export type ModuleKind = "income" | "asset" | "dscr";

export interface Analysis {
  id: string;
  loanNumber: string;
  module: ModuleKind;
  borrowerName: string; // fake
  status: AnalysisStatus;
  documents: DocumentRecord[];
  result?: CalculationResult;
  method?: string; // currently selected calculation method id
  guideline?: string; // selected agency/investor guideline overlay (preview only)
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}
