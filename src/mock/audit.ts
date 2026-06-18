/* =============================================================================
 * SEAM 7 — AUDIT LOG  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with the real append-only, tamper-evident
 * audit store (write-once, server-side, retained per policy). SOC2 expects
 * privileged actions — especially PII reveal/detokenization, overrides, and
 * finalization — to be logged with actor, timestamp, and context.
 *
 * Here we keep a capped, append-only list in localStorage purely so the
 * behavior is visible in Settings → Security. It is NOT a real audit trail.
 * ========================================================================== */

import { uid } from "../lib/id";

export type AuditAction =
  | "pii.reveal"
  | "pii.mask"
  | "analysis.finalize"
  | "role.switch";

export interface AuditEvent {
  id: string;
  action: AuditAction;
  actor: string;
  role: string;
  detail: string;
  timestamp: string;
}

const KEY = "askbob.audit.v1";
const CAP = 200;

export function recordAudit(event: Omit<AuditEvent, "id" | "timestamp">): void {
  const entry: AuditEvent = { ...event, id: uid("aud"), timestamp: new Date().toISOString() };
  try {
    const log = getAuditLog();
    log.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(log.slice(0, CAP)));
  } catch (err) {
    console.warn("[audit] failed to record", err);
  }
}

export function getAuditLog(): AuditEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as AuditEvent[];
  } catch {
    return [];
  }
}

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  "pii.reveal": "PII revealed",
  "pii.mask": "PII re-masked",
  "analysis.finalize": "Analysis finalized",
  "role.switch": "Role switched",
};
