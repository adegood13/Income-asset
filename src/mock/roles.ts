/* =============================================================================
 * SEAM 6 — ROLES & PERMISSIONS (RBAC)  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with the real identity provider + authorization
 * service (e.g., SSO/OIDC claims, a policy engine). Permissions would be
 * enforced server-side on every request — never trust the client. This module
 * only drives what the UI shows/enables so the RBAC model is demonstrable.
 *
 * SOC2 note: revealing PII is a privileged action. It is gated by the
 * `pii:reveal` permission here and audit-logged (see mock/audit.ts).
 * ========================================================================== */

export type Permission =
  | "pii:reveal" // detokenize / unmask identifier fields
  | "analysis:edit" // override captured field values
  | "analysis:finalize" // lock an analysis
  | "settings:manage"; // change configuration

export type Role = "underwriter" | "processor" | "auditor" | "admin";

export interface RoleDef {
  id: Role;
  label: string;
  description: string;
  permissions: Permission[];
}

export const ROLES: Record<Role, RoleDef> = {
  underwriter: {
    id: "underwriter",
    label: "Senior Underwriter",
    description: "Reviews and finalizes analyses; may reveal PII when needed.",
    permissions: ["pii:reveal", "analysis:edit", "analysis:finalize"],
  },
  processor: {
    id: "processor",
    label: "Loan Processor",
    description: "Prepares analyses and edits values, but cannot unmask PII.",
    permissions: ["analysis:edit"],
  },
  auditor: {
    id: "auditor",
    label: "Compliance Auditor",
    description: "Read-only review of analyses and the audit trail. No PII, no edits.",
    permissions: [],
  },
  admin: {
    id: "admin",
    label: "Administrator",
    description: "Full access including configuration and PII reveal.",
    permissions: ["pii:reveal", "analysis:edit", "analysis:finalize", "settings:manage"],
  },
};

export const ROLE_LIST: RoleDef[] = Object.values(ROLES);

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLES[role]?.permissions.includes(permission) ?? false;
}
