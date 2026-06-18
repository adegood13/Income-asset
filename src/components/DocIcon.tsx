import {
  FileText,
  FileSpreadsheet,
  Receipt,
  Landmark,
  LineChart,
  FileBadge,
  Building2,
  FileSignature,
  ClipboardList,
  Calculator,
  type LucideIcon,
} from "lucide-react";
import type { DocType } from "../types";

const ICONS: Record<DocType, LucideIcon> = {
  W2: FileBadge,
  Paystub: Receipt,
  "1040": FileText,
  ScheduleC: FileSpreadsheet,
  ScheduleE: FileSpreadsheet,
  K1: FileSpreadsheet,
  "1120S": Building2,
  BankStatement: Landmark,
  InvestmentStatement: LineChart,
  LeaseAgreement: FileSignature,
  RentSchedule: ClipboardList,
  OperatingStatement: Calculator,
};

export function DocIcon({ type, className }: { type: DocType; className?: string }) {
  const Icon = ICONS[type] ?? FileText;
  return <Icon className={className} />;
}
