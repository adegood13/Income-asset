// HTML escaping for the few places we build raw HTML strings for a new window
// (printable worksheet, source-document facsimile). User-editable values (field
// overrides, notes, loan numbers) MUST be escaped before interpolation to
// prevent stored-XSS when that HTML is written to a popup document.
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
