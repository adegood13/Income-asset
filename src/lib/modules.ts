import { Banknote, PiggyBank, Home, type LucideIcon } from "lucide-react";
import type { ModuleKind } from "../types";

// Shared labels/descriptions/icons for the three analysis modules.
export const MODULE_LABEL: Record<ModuleKind, string> = {
  income: "Income",
  asset: "Asset",
  dscr: "DSCR",
};

export const MODULE_DESC: Record<ModuleKind, string> = {
  income: "W-2s, paystubs, tax returns, and self-employment income.",
  asset: "Bank statements, investment and retirement accounts.",
  dscr: "Investment-property debt-service coverage (rent ÷ PITIA).",
};

export const MODULE_ICON: Record<ModuleKind, LucideIcon> = {
  income: Banknote,
  asset: PiggyBank,
  dscr: Home,
};
