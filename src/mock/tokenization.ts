/* =============================================================================
 * SEAM 3 — TOKENIZATION / PII MASKING  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with the real tokenization vault and
 * detokenization service. Here we just do naive string masking for identifier
 * fields and honor a global reveal toggle. No real PII ever lives in this app.
 *
 * In production:
 *   - Identifier values would be stored as vault tokens, never raw.
 *   - `reveal()` would call a detokenization endpoint gated by user permission
 *     and would be fully audit-logged.
 *   - Masking format would be policy-driven per tenant.
 * ========================================================================== */

import type { CapturedField } from "../types";

// Mask a Social Security Number: "123-45-6789" -> "•••-••-6789"
export function maskSSN(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return "•••-••-••••";
  return `•••-••-${digits.slice(-4)}`;
}

// Mask an account number, keeping the last 4: "00012345678" -> "••••5678"
export function maskAccount(raw: string): string {
  const digits = raw.replace(/\s/g, "");
  if (digits.length <= 4) return "••••";
  return `••••${digits.slice(-4)}`;
}

// Mask a person's name: "Robert Martinez" -> "R••• M•••"
export function maskName(raw: string): string {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part.length ? `${part[0]}•••` : part))
    .join(" ");
}

// Mask a tenant id for the top bar: "Tenant 4821" -> "Tenant ••• 4821"
export function maskTenant(id: string): string {
  return `Tenant ••• ${id}`;
}

// Decide how to present an identifier field given the global reveal state.
// Financial + text fields are returned as-is; the math runs on clean numbers.
export function presentField(field: CapturedField, reveal: boolean): string {
  const raw = String(field.value);
  if (field.type !== "identifier" || reveal) return raw;
  return maskIdentifier(field.label, raw);
}

// Heuristic mask routing by field label — production would route by field's
// declared PII class from the vault, not by label text.
export function maskIdentifier(label: string, raw: string): string {
  const l = label.toLowerCase();
  if (l.includes("ssn") || l.includes("social")) return maskSSN(raw);
  if (l.includes("account") || l.includes("acct")) return maskAccount(raw);
  if (l.includes("name") || l.includes("borrower")) return maskName(raw);
  // Generic fallback: keep last 2 visible.
  if (raw.length <= 2) return "••••";
  return `••••${raw.slice(-2)}`;
}
