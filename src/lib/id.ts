// Tiny id helper. Prefers crypto.randomUUID, falls back for older runtimes.
export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

// Auto-generate a plausible loan number, e.g. "LN-2026-00471".
export function generateLoanNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(100 + Math.random() * 9899)).padStart(5, "0");
  return `LN-${year}-${seq}`;
}
