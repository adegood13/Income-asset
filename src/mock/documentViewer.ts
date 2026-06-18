/* =============================================================================
 * SEAM 5 — SOURCE DOCUMENT VIEWER  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with a link to the real stored document — the
 * original PDF / image fetched from the document store (signed URL), shown in a
 * viewer with the extracted fields overlaid on the page at their bounding boxes.
 *
 * Here there is no real file, so we render a labelled facsimile of the captured
 * document in a new browser tab: a "scanned form" styled page that lists each
 * captured field with its value, confidence, and provenance. Identifier values
 * respect the global PII reveal toggle. A clear MOCK banner makes the synthetic
 * nature obvious.
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

/**
 * Open a facsimile of the source document in a new tab. Production swaps this
 * for the real stored-document URL.
 */
export function openDocumentView(doc: DocumentRecord, reveal: boolean) {
  const overall = doc.overallConfidence;
  const overallHex = CONFIDENCE_HEX[tierFor(overall)];

  // Group rows the same way the workspace does, for familiarity.
  const groups = new Map<string, typeof doc.fields>();
  for (const f of doc.fields) {
    const key = f.group ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  const sections = Array.from(groups.entries())
    .map(([group, fields]) => {
      const rows = fields
        .map((field) => {
          const hex = CONFIDENCE_HEX[tierFor(field.confidence)];
          return `<tr>
            <td class="lbl">${escapeHtml(field.label)}</td>
            <td class="val mono">${escapeHtml(fieldDisplay(field.label, field.value, field.type, reveal))}</td>
            <td class="conf mono" style="color:${hex}">${field.confidence}</td>
            <td class="prov">${escapeHtml(field.provenance)}</td>
          </tr>`;
        })
        .join("");
      return `<section>
        <h2>${escapeHtml(group)}</h2>
        <table>
          <thead><tr><th>Field</th><th>Captured value</th><th>Conf.</th><th>Region / source</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${escapeHtml(DOC_TYPE_LABEL[doc.docType])} · source document</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
    * { box-sizing: border-box; }
    body { font-family: Figtree, system-ui, sans-serif; color:#1F232B; margin:0; background:#E6E8EC; }
    .wrap { max-width: 860px; margin: 0 auto; padding: 28px 20px 60px; }
    .mockbar { display:flex; align-items:center; gap:10px; background:#151922; color:#fff; border-radius:12px; padding:12px 16px; margin-bottom:18px; font-size:13px; }
    .mockbar .tag { background:#19D467; color:#0A0A0A; font-weight:800; font-size:11px; letter-spacing:.08em; padding:2px 8px; border-radius:999px; }
    .sheet { background:#fff; border:1px solid #D5D8DE; border-radius:14px; box-shadow:0 18px 40px -22px rgba(10,10,10,.3); overflow:hidden; }
    .sheet-head { background:linear-gradient(135deg,#003CAB 0%,#1281DE 55%,#0AC6FF 100%); color:#fff; padding:22px 26px; }
    .sheet-head .kicker { font-size:11px; text-transform:uppercase; letter-spacing:.16em; opacity:.85; }
    .sheet-head h1 { font-family:Figtree; font-size:24px; margin:4px 0 0; color:#fff; }
    .sheet-head .period { opacity:.9; font-size:14px; margin-top:2px; }
    .docchip { display:inline-flex; align-items:center; gap:8px; margin-top:12px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.3); border-radius:999px; padding:4px 12px; font-size:12px; }
    .body { padding: 8px 26px 26px; }
    section { margin-top:20px; }
    h2 { font-size:11px; text-transform:uppercase; letter-spacing:.16em; color:#8A8D94; margin:0 0 8px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#8A8D94; border-bottom:1px solid #E6E8EC; padding:6px 8px; }
    td { padding:8px; border-bottom:1px solid #F2F4F7; vertical-align:top; }
    .lbl { color:#3A3D44; font-weight:600; width:34%; }
    .val { color:#0A0A0A; font-weight:600; }
    .mono { font-family:'JetBrains Mono', Consolas, monospace; font-variant-numeric: tabular-nums; }
    .conf { width:56px; font-weight:700; }
    .prov { color:#8A8D94; font-size:12px; }
    .foot { margin-top:18px; font-size:11px; color:#8A8D94; text-align:center; }
  </style></head>
  <body><div class="wrap">
    <div class="mockbar">
      <span class="tag">MOCK</span>
      <span>Facsimile of the captured document. In production this links to the original stored PDF / image with field regions highlighted.</span>
    </div>
    <div class="sheet">
      <div class="sheet-head">
        <div class="kicker">Source document · used for this calculation</div>
        <h1>${escapeHtml(DOC_TYPE_LABEL[doc.docType])}</h1>
        <div class="period">${escapeHtml(doc.periodLabel)}</div>
        <span class="docchip">Overall confidence <strong class="mono" style="color:#fff">${overall}</strong>
          <span style="width:8px;height:8px;border-radius:99px;background:${overallHex};display:inline-block"></span>
        </span>
      </div>
      <div class="body">${sections}</div>
    </div>
    <div class="foot">AskBobAI prototype · viewed ${formatDateTime(new Date().toISOString())} · synthetic data, not a real document.</div>
  </div></body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked. Allow pop-ups for this site to view source documents.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
}
