/* =============================================================================
 * SEAM 5 — SOURCE DOCUMENT VIEWER  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with the real stored document — the original
 * PDF / image fetched from the document store (signed URL), shown in a viewer
 * opened to the exact page with the extracted field's bounding box highlighted.
 *
 * Here there is no real file, so we render a labelled facsimile in a new tab:
 * a "scanned form" split into pages, listing each captured field. When opened
 * from a specific data point we jump to that field's page and highlight the row
 * (via a baked-in CSS class + anchor scroll — no inline script, so it stays
 * within the app's strict CSP). Identifier values respect the PII reveal toggle.
 * ========================================================================== */

import type { DocumentRecord } from "../types";
import { DOC_TYPE_LABEL } from "./extraction";
import { maskIdentifier } from "./tokenization";
import { asNumber, formatMoney, formatDateTime } from "../lib/format";
import { tierFor, CONFIDENCE_HEX } from "../lib/confidence";
import { escapeHtml } from "../lib/html";

function fieldDisplay(label: string, value: string | number, type: string, reveal: boolean): string {
  if (type === "identifier" && !reveal) return maskIdentifier(label, String(value));
  if (type === "financial") return formatMoney(asNumber(value), { cents: true });
  return String(value);
}

// Derive the source page from the provenance string (e.g. "1040 p.1, line 11").
function pageFromProvenance(provenance: string): number {
  const m = provenance.match(/p(?:age)?\.?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}

/**
 * Open a facsimile of the source document in a new tab. If `targetFieldId` is
 * given, jump to that field's page and highlight it. Production swaps this for
 * the real stored-document URL + page + bounding-box highlight.
 */
export function openDocumentView(doc: DocumentRecord, reveal: boolean, targetFieldId?: string) {
  const overall = doc.overallConfidence;
  const overallHex = CONFIDENCE_HEX[tierFor(overall)];
  const target = targetFieldId ? doc.fields.find((f) => f.id === targetFieldId) : undefined;

  // Group fields by source page.
  const pages = new Map<number, typeof doc.fields>();
  for (const f of doc.fields) {
    const pg = pageFromProvenance(f.provenance);
    if (!pages.has(pg)) pages.set(pg, []);
    pages.get(pg)!.push(f);
  }
  const sortedPages = Array.from(pages.entries()).sort((a, b) => a[0] - b[0]);

  const pagesHtml = sortedPages
    .map(([pg, fields]) => {
      const rows = fields
        .map((field) => {
          const hex = CONFIDENCE_HEX[tierFor(field.confidence)];
          const isTarget = field.id === targetFieldId;
          return `<tr id="f-${escapeHtml(field.id)}" class="${isTarget ? "hl" : ""}">
            <td class="lbl">${escapeHtml(field.label)}${
              field.group ? ` <span class="tag">${escapeHtml(field.group)}</span>` : ""
            }</td>
            <td class="val mono">${escapeHtml(fieldDisplay(field.label, field.value, field.type, reveal))}</td>
            <td class="conf mono" style="color:${hex}">${field.confidence}</td>
            <td class="prov">${escapeHtml(field.provenance)}</td>
          </tr>`;
        })
        .join("");
      return `<section class="page">
        <div class="page-head"><span>Page ${pg}</span><span class="page-of">${DOC_TYPE_LABEL[doc.docType]}</span></div>
        <table>
          <thead><tr><th>Field</th><th>Captured value</th><th>Conf.</th><th>Region / source</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
    })
    .join("");

  const jumpBanner = target
    ? `<div class="jump">Jumped to <strong>${escapeHtml(target.label)}</strong>
        on page ${pageFromProvenance(target.provenance)} ·
        <span class="mono" style="color:${CONFIDENCE_HEX[tierFor(target.confidence)]}">${target.confidence}</span> confidence</div>`
    : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${escapeHtml(DOC_TYPE_LABEL[doc.docType])} · source document</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: Figtree, system-ui, sans-serif; color:#1F232B; margin:0; background:#E6E8EC; }
    .wrap { max-width: 880px; margin: 0 auto; padding: 20px 20px 80px; }
    .mockbar { position:sticky; top:0; z-index:5; display:flex; align-items:center; gap:10px; background:#151922; color:#fff; border-radius:0 0 12px 12px; padding:12px 16px; margin-bottom:18px; font-size:13px; }
    .mockbar .tag { background:#19D467; color:#0A0A0A; font-weight:800; font-size:11px; letter-spacing:.08em; padding:2px 8px; border-radius:999px; }
    .jump { background:#EDF7FF; border:1px solid #BFE0FB; border-radius:10px; padding:10px 14px; margin-bottom:16px; font-size:13px; color:#0A2A4A; }
    .sheet-head { background:linear-gradient(135deg,#003CAB 0%,#1281DE 55%,#0AC6FF 100%); color:#fff; padding:22px 26px; border-radius:14px 14px 0 0; }
    .sheet-head .kicker { font-size:11px; text-transform:uppercase; letter-spacing:.16em; opacity:.85; }
    .sheet-head h1 { font-family:Figtree; font-size:24px; margin:4px 0 0; color:#fff; }
    .sheet-head .period { opacity:.9; font-size:14px; margin-top:2px; }
    .docchip { display:inline-flex; align-items:center; gap:8px; margin-top:12px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.3); border-radius:999px; padding:4px 12px; font-size:12px; }
    .page { background:#fff; border:1px solid #D5D8DE; border-top:0; padding: 8px 26px 22px; }
    .page:last-of-type { border-radius:0 0 14px 14px; }
    .page-head { display:flex; justify-content:space-between; align-items:center; padding:14px 0 6px; border-bottom:2px dashed #E6E8EC; margin-bottom:6px; }
    .page-head span:first-child { font-weight:800; font-size:13px; color:#0A0A0A; }
    .page-of { font-size:11px; color:#8A8D94; text-transform:uppercase; letter-spacing:.1em; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#8A8D94; border-bottom:1px solid #E6E8EC; padding:6px 8px; }
    td { padding:9px 8px; border-bottom:1px solid #F2F4F7; vertical-align:top; }
    tr[id^="f-"] { scroll-margin-top: 110px; }
    .lbl { color:#3A3D44; font-weight:600; width:38%; }
    .tag { display:inline-block; margin-left:6px; font-size:9px; text-transform:uppercase; letter-spacing:.06em; color:#6A6A6A; background:#F2F4F7; border-radius:6px; padding:1px 6px; vertical-align:middle; }
    .val { color:#0A0A0A; font-weight:600; }
    .mono { font-family:'JetBrains Mono', Consolas, monospace; font-variant-numeric: tabular-nums; }
    .conf { width:56px; font-weight:700; }
    .prov { color:#8A8D94; font-size:12px; }
    /* Highlighted target row: left accent + a fading flash. */
    tr.hl td { background:#FFF6CC; }
    tr.hl td:first-child { box-shadow: inset 3px 0 0 #F5A623; }
    tr.hl td { animation: flash 2.4s ease-out 1; }
    @keyframes flash { 0% { background:#FFE070; } 100% { background:#FFF6CC; } }
    .foot { margin-top:18px; font-size:11px; color:#8A8D94; text-align:center; }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior:auto; } tr.hl td { animation:none; } }
  </style></head>
  <body><div class="wrap">
    <div class="mockbar">
      <span class="tag">MOCK</span>
      <span>Facsimile of the captured document. In production this opens the original stored PDF / image to the exact page with the field region highlighted.</span>
    </div>
    ${jumpBanner}
    <div class="sheet-head">
      <div class="kicker">Source document · used for this calculation</div>
      <h1>${escapeHtml(DOC_TYPE_LABEL[doc.docType])}</h1>
      <div class="period">${escapeHtml(doc.periodLabel)}</div>
      <span class="docchip">Overall confidence <strong class="mono" style="color:#fff">${overall}</strong>
        <span style="width:8px;height:8px;border-radius:99px;background:${overallHex};display:inline-block"></span>
      </span>
    </div>
    ${pagesHtml}
    <div class="foot">AskBobAI prototype · viewed ${formatDateTime(new Date().toISOString())} · synthetic data, not a real document.</div>
  </div></body></html>`;

  // Open as a separate window (not a tab) so it can sit beside the workspace.
  const w = 920;
  const left = Math.max(0, (window.screen.availWidth ?? 1400) - w - 40);
  const win = window.open("", "", `popup=yes,width=${w},height=1000,left=${left},top=60`);
  if (!win) {
    alert("Pop-up blocked. Allow pop-ups for this site to view source documents.");
    return;
  }
  win.document.write(html);
  win.document.close();
  // Jump to the target field's row (anchor scroll, no inline script => CSP-safe).
  if (target) {
    try {
      win.location.hash = `f-${target.id}`;
    } catch {
      /* ignore */
    }
  }
  win.focus();
}
