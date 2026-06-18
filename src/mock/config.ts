/* =============================================================================
 * SEAM 8 — TENANT / PLATFORM CONFIGURATION  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with real per-tenant configuration services:
 * the identity provider + user directory, the org/tenant admin service, the
 * security policy store, and the versioned rules-engine configuration. Here it
 * all lives in localStorage so the admin screens are fully clickable for demos.
 * ========================================================================== */

import type { Role } from "./roles";
import type { ModuleKind } from "../types";

export type MaskStyle = "last4" | "full";
export type DataRegion = "us-east" | "us-west" | "eu" | "ca";

// Admin-defined calculation methods (parameterized templates the rules engine
// can execute). See CUSTOM_METHOD_KINDS in rules.ts.
export type CustomMethodKind = "bank_income_factor" | "asset_balance_factor" | "asset_haircut";

export interface CustomMethod {
  id: string;
  label: string;
  module: ModuleKind;
  kind: CustomMethodKind;
  factorPct: number; // 0–100, meaning depends on kind
  enabled: boolean;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "disabled";
}

export interface OrgConfig {
  name: string;
  dataRegion: DataRegion;
  sessionTimeoutMins: number;
  enforceSSO: boolean;
}

export interface SecurityConfig {
  mfaRequired: boolean;
  detokenizationRequiresReason: boolean;
  auditRetentionDays: number;
  maskStyle: MaskStyle;
  ipAllowlist: string;
}

export interface AppConfig {
  org: OrgConfig;
  security: SecurityConfig;
  users: MockUser[];
  disabledMethods: string[]; // built-in calculation method ids turned off
  disabledGuidelines: string[]; // guideline overlay ids turned off
  customMethods: CustomMethod[]; // admin-defined methods
  methodOverrides: Record<string, string>; // method id -> renamed label
}

export const DATA_REGIONS: { id: DataRegion; label: string }[] = [
  { id: "us-east", label: "US East (Virginia)" },
  { id: "us-west", label: "US West (Oregon)" },
  { id: "eu", label: "EU (Frankfurt)" },
  { id: "ca", label: "Canada (Toronto)" },
];

export const DEFAULT_CONFIG: AppConfig = {
  org: {
    name: "Meridian Mortgage Partners",
    dataRegion: "us-east",
    sessionTimeoutMins: 30,
    enforceSSO: true,
  },
  security: {
    mfaRequired: true,
    detokenizationRequiresReason: true,
    auditRetentionDays: 365,
    maskStyle: "last4",
    ipAllowlist: "",
  },
  users: [
    { id: "usr_andrew", name: "Andrew Cole", email: "andrew.cole@meridianmtg.com", role: "admin", status: "active" },
    { id: "usr_robert", name: "Robert Ellis", email: "robert.ellis@meridianmtg.com", role: "underwriter", status: "active" },
    { id: "usr_sofia", name: "Sofia Marin", email: "sofia.marin@meridianmtg.com", role: "processor", status: "active" },
    { id: "usr_dale", name: "Dale Brooks", email: "dale.brooks@meridianmtg.com", role: "auditor", status: "active" },
    { id: "usr_nina", name: "Nina Powell", email: "nina.powell@meridianmtg.com", role: "underwriter", status: "invited" },
  ],
  disabledMethods: [],
  disabledGuidelines: [],
  customMethods: [
    {
      id: "cm_biz35",
      label: "Bank Statements — Business (35% expense)",
      module: "income",
      kind: "bank_income_factor",
      factorPct: 35,
      enabled: true,
    },
  ],
  methodOverrides: {},
};

const KEY = "askbob.config.v1";

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    // Shallow-merge with defaults so new fields appear for existing installs.
    return {
      org: { ...DEFAULT_CONFIG.org, ...parsed.org },
      security: { ...DEFAULT_CONFIG.security, ...parsed.security },
      users: parsed.users ?? DEFAULT_CONFIG.users,
      disabledMethods: parsed.disabledMethods ?? [],
      disabledGuidelines: parsed.disabledGuidelines ?? [],
      customMethods: parsed.customMethods ?? DEFAULT_CONFIG.customMethods,
      methodOverrides: parsed.methodOverrides ?? {},
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(config));
  } catch (err) {
    console.warn("[config] failed to save", err);
  }
}
