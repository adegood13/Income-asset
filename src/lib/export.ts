// Export helpers — mock worksheet (printable HTML + JSON) and CSV for reports.
// In production these would be generated server-side as signed PDFs; here we
// keep it client-only so the prototype needs no backend.
import type { Analysis } from "../types";
import { DOC_TYPE_LABEL } from "../mock/extraction";
import { maskIdentifier } from "../mock/tokenization";
import { formatMoney, formatDateTime, asNumber } from "./format";
import { tierFor, CONFIDENCE_HEX } from "./confidence";

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadAnalysisJSON(analysis: Analysis) {
  triggerDownload(
    `${analysis.loanNumber}-worksheet.json`,
    JSON.stringify(analysis, null, 2),
    "application/json",
  );
}

function fieldDisplay(label: string, value: string | number, type: string, reveal: boolean): string {
  if (type === "identifier" && !reveal) return maskIdentifier(label, String(value));
  if (type === "financial") return formatMoney(asNumber(value), { cents: true });
  return String(value);
}

// Opens a clean, print-ready worksheet in a new window and invokes print.
export function openPrintableWorksheet(analysis: Analysis, reveal: boolean) {
  const resultLabel = analysis.module === "income" ? "Qualifying Monthly Income" : "Qualifying Assets";
  const docsHtml = analysis.documents
    .map((d) => {
      const rows = d.fields
        .map((field) => {
          const hex = CONFIDENCE_HEX[tierFor(field.confidence)];
          return `<tr>
            <td>${field.label}</td>
            <td class="mono">${fieldDisplay(field.label, field.value, field.type, reveal)}${
              field.overridden ? ' <span class="ov">(overridden)</span>' : ""
            }</td>
            <td class="mono" style="color:${hex}">${field.confidence}</td>
            <td class="prov">${field.provenance}</td>
          </tr>`;
        })
        .join("");
      return `<section>
        <h3>${DOC_TYPE_LABEL[d.docType]} <span class="muted">· ${d.periodLabel}</span></h3>
        <table>
          <thead><tr><th>Field</th><th>Value</th><th>Conf.</th><th>Source</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
    })
    .join("");

  const stepsHtml = analysis.result
    ? analysis.result.steps
        .map(
          (s) => `<tr>
            <td>${s.label}<div class="prov">${s.detail}</div></td>
            <td class="mono">${formatMoney(s.result, { cents: true })}</td>
          </tr>`,
        )
        .join("")
    : "<tr><td>No calculation run.</td><td></td></tr>";

  const notesHtml = analysis.notes.length
    ? analysis.notes
        .map(
          (n) =>
            `<li><strong>${n.author}</strong> <span class="muted">· ${formatDateTime(
              n.timestamp,
            )}</span><br/>${n.body}</li>`,
        )
        .join("")
    : "<li class='muted'>No notes.</li>";

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${analysis.loanNumber} · Worksheet</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;800&family=JetBrains+Mono:wght@500&display=swap');
    * { box-sizing: border-box; }
    body { font-family: Figtree, system-ui, sans-serif; color: #1F232B; margin: 40px; }
    h1, h2, h3 { font-family: Figtree, sans-serif; color: #0A0A0A; }
    h1 { font-size: 22px; margin: 0; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1281DE; padding-bottom:16px; margin-bottom:20px; }
    .brand { font-family: Figtree; font-weight: 800; font-size: 20px; color:#0A0A0A; }
    .mono { font-family: 'JetBrains Mono', Consolas, monospace; }
    .muted { color:#6A6A6A; font-weight:400; }
    .hero { background:#EDF7FF; border:1px solid #cfe6fb; border-radius:12px; padding:18px 22px; margin:18px 0; }
    .hero .label { font-size:12px; text-transform:uppercase; letter-spacing:.12em; color:#3A3D44; }
    .hero .num { font-family:'JetBrains Mono', Consolas, monospace; font-size:34px; font-weight:600; color:#0A0A0A; }
    table { width:100%; border-collapse:collapse; margin:8px 0 4px; font-size:13px; }
    th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#6A6A6A; border-bottom:1px solid #E6E8EC; padding:6px 8px; }
    td { padding:6px 8px; border-bottom:1px solid #EEF2F6; vertical-align:top; }
    .prov { color:#94A6B5; font-size:11px; }
    .ov { color:#9A6300; font-size:11px; }
    section { margin-bottom:18px; break-inside: avoid; }
    ul { padding-left:18px; } li { margin-bottom:8px; font-size:13px; }
    .meta { font-size:13px; color:#3A3D44; }
    .foot { margin-top:28px; padding-top:12px; border-top:1px solid #E0E7EE; font-size:11px; color:#94A6B5; }
    @media print { body { margin: 20px; } }
  </style></head>
  <body>
    <div class="head">
      <div>
        <div class="brand">Ask<span>Bob</span>AI</div>
        <div class="meta">${analysis.module === "income" ? "Income" : "Asset"} Analysis Worksheet</div>
      </div>
      <div style="text-align:right">
        <h1 class="mono">${analysis.loanNumber}</h1>
        <div class="meta">Borrower: ${reveal ? analysis.borrowerName : maskIdentifier("name", analysis.borrowerName)}</div>
        <div class="meta">Status: ${analysis.status} · ${formatDateTime(analysis.updatedAt)}</div>
      </div>
    </div>

    <div class="hero">
      <div class="label">${resultLabel} · ${analysis.result?.methodLabel ?? "—"}</div>
      <div class="num">${analysis.result ? formatMoney(analysis.result.monthlyQualifying, { cents: true }) : "—"}</div>
    </div>

    <h2>Calculation lineage</h2>
    <table><tbody>${stepsHtml}</tbody></table>

    <h2 style="margin-top:24px">Captured data</h2>
    ${docsHtml}

    <h2>Notes</h2>
    <ul>${notesHtml}</ul>

    <div class="foot">Generated by AskBobAI prototype · ${formatDateTime(
      new Date().toISOString(),
    )} · MOCK worksheet for UX validation. Not for production use.</div>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    // Popup blocked — fall back to an HTML download.
    triggerDownload(`${analysis.loanNumber}-worksheet.html`, html, "text/html");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  triggerDownload(filename, csv, "text/csv");
}
