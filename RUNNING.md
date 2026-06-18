# Running the AskBob Income & Asset prototype

A clickable, front-end-only prototype of an **assist-mode** mortgage income &
asset calculation platform. It mocks every backend concern so you can run it
locally, click through, and form opinions before the engineering team builds the
real thing.

## Prerequisites

- Node.js 18+ (developed on Node 22)
- npm

## Install & run

```bash
npm install
npm run dev
```

Then open the printed URL (defaults to <http://localhost:5173>).

Other scripts:

```bash
npm run build     # type-check + production build to /dist
npm run preview   # serve the production build locally
```

State (your edits, overrides, notes, finalized status) is persisted to the
browser's **localStorage**, so it survives a refresh. To start over, go to
**Settings → Reset demo data**, or clear the site's localStorage.

## What to try

1. **Dashboard** → summary cards + a table of seeded analyses. Click any row.
   **Search** by loan number or borrower name (matches the real name even when PII
   is masked), and **Export** the current list to CSV.
2. **New analysis** → pick Income or Asset, auto-generate or type a loan number,
   "upload" a sample document (mock ~1s extraction), and land in the workspace.
3. **Workspace** (the centerpiece, three columns):
   - *Documents* (left) — switch between attached docs, add another, and open
     the **source document** (the 🔎 icon, or "View source document" in the
     center header) — a labelled facsimile of the page used for the calculation.
   - *Data points* (center) — every captured field with a **confidence badge**,
     a provenance hint, and an editable value. Edit a financial field and watch
     it flag as **overridden** (with a "was…" original and a reset). Add a
     per-field note. Identifier fields are masked until you toggle PII reveal.
     **Each field's source citation is a link** — click it to open the source
     document at that exact page with the field highlighted (fast low-confidence
     review). Fields locked by the admin confidence policy grey out.
   - *Calculation* (right) — the qualifying figure, a **method dropdown** (switch
     it and the number + lineage change), the **step-by-step audit lineage**,
     Recalculate, and a **live agency/investor guideline selector** (all agencies
     + 5 Non-QM investors). The selector works; the "Coming soon" toggle beside
     it shows the overlay rules aren't applied to the math yet — see
     `GUIDELINE_GROUPS` in `src/mock/rules.ts`.
   - **Resize the columns** — drag the dividers between columns (desktop ≥1280px);
     widths persist to `localStorage`.
   - **Pop out a panel** — the ⤢ icon on Documents, Data points, Calculation, and
     the **Calculation lineage** opens it in a **separate OS window** (not a tab),
     so you can place panels side-by-side across monitors. Popped panels share
     live state (edits stay in sync). Close the window or click "Return" to
     re-dock. *(Allow pop-ups for the site.)*
   - Header actions: **Save**, **Finalize** (locks the analysis), **Export**
     (printable worksheet or JSON), and an append-only **Notes** drawer.
3c. **Bank-statement income (Non-QM)** — in **New analysis → Income**, pick
   **"Bank statements (12–24 mo income)"** and choose 12 or 24 months. The blob
   "uploads" as N monthly statements (try the seeded **LN-2026-00501**). In the
   workspace: step through each month in the left column, edit any deposit,
   **Include/Exclude** individual deposits (large wires are excluded by default),
   and **+ Add deposit line item** for anything the system missed. The right
   panel offers **Personal (avg deposits)** and **Business (50% expense factor)**
   methods; the lineage shows each month's eligible total → sum → ÷ months.
4. **PII mask toggle** (top bar) — flips identifier masking everywhere. Off by
   default (identifiers masked). **Now role-gated**: only roles with the
   `pii:reveal` permission can unmask. Switch roles from the avatar menu
   (Underwriter / Processor / Auditor / Admin) and watch the toggle, editing, and
   finalize gate accordingly. Privileged actions are written to an audit log
   (Settings → Security).
4b. **Dark mode** — theme toggle in the top bar cycles Light / Dark / System;
   the choice persists and applies before first paint (no flash).
5. **Reports** → mock charts (volume by status, confidence distribution,
   override rate over time, average turn time) with a date-range filter and CSV
   export.
6. **Settings** (tabbed, fully built out for demo; edits gated to the **Admin**
   role — switch via the avatar menu):
   - **Access** — your role + permissions.
   - **Calculation rules** — enable/disable income & asset methods and guideline
     overlays; toggles take effect live in the workspace method/overlay dropdowns.
   - **Users & roles** — mock user directory (invite, assign role, enable/disable,
     remove) + a roles × permissions matrix.
   - **Tenant** — org name, data residency, session timeout, enforce-SSO.
   - **Security** — MFA, detokenization-requires-reason, mask style, audit
     retention, IP allowlist, and the **field-lock policy** (lock fields at/above a
     confidence score, e.g. ≥ 97%).
   - **Audit log** — append-only privileged-action history.
   - **Demo data** — reset sample analyses.

## The mock "seams" (engineering handoff)

Each file below is the single, clearly-labeled place where the prototype fakes a
production system. Each starts with a comment block describing what production
replaces it with.

| Seam | File | What it fakes | Production replaces with |
|------|------|---------------|--------------------------|
| 1 | `src/mock/extraction.ts` | Document upload + OCR + field extraction. Returns pre-baked `DocumentRecord`s with per-field confidence. | The real extraction API. |
| 2 | `src/mock/rules.ts` | Calculation methods + the agency/investor guideline list (`GUIDELINE_GROUPS`). Returns a `CalculationResult` whose `steps[]` are the audit lineage. | The real versioned, per-tenant rules engine with guideline overlays. |
| 3 | `src/mock/tokenization.ts` | PII masking for identifier fields + the global reveal toggle. | The real tokenization vault + detokenization service. |
| 4 | `src/mock/store.ts` | `localStorage`-backed persistence for analyses and notes (seeded from `src/mock/seed.ts`). | The real backend, append-only audit store, and auth. |
| 5 | `src/mock/documentViewer.ts` | "View source document" — renders a facsimile of the captured page in a new tab. | A link to the original stored PDF/image (signed URL) with field regions overlaid. |
| 6 | `src/mock/roles.ts` | RBAC — roles → permissions (`pii:reveal`, `analysis:edit`, …). Gates UI only. | Real authn (SSO/OIDC) + **server-enforced** authorization. |
| 7 | `src/mock/audit.ts` | Append-only audit log of privileged actions (PII reveal, finalize, role switch). | The tamper-evident, server-side audit store with retention. |
| 8 | `src/mock/config.ts` | Tenant/platform configuration (org, security, users, rule toggles) in localStorage; drives the Settings screens. | Per-tenant config services: identity/user directory, org admin, security policy, versioned rules config. |

## Tech stack

Vite + React + TypeScript, Tailwind CSS, `recharts` (charts), `lucide-react`
(icons). React state + `localStorage` for persistence — no state-management
library.

Visuals follow the **AskBobAI Brand Guide (Edition 01, 2026)**:

- **Type** — Figtree carries the system (display + body); Instrument Serif
  italic for single-word accents; JetBrains Mono / Consolas for data & metadata.
- **Color** — AskBob Blue `#1281DE` carries the mood (sky-gradient hero
  surfaces), Ink `#0A0A0A` / Night Ink `#151922` carry the message, and AskBob
  Green `#19D467` marks the moment of action (CTAs only). Brand red `#A92922`
  for errors. Confidence scale: green / amber / red.
- **Logo** — sparkle mark in AskBob Green + Figtree Extra Bold wordmark.

## Project layout

```
src/
  main.tsx, App.tsx        # entry + router wiring
  types.ts                 # domain model
  state/                   # AppContext (global state) + tiny hash router
  mock/                    # the four seams + seed data  ← engineering starts here
  lib/                     # formatting, confidence scale, export, analytics
  components/              # shared UI (shell, confidence badge, field row, …)
  pages/                   # Dashboard, AnalysisList, AnalysisWorkspace, Reports, Settings
```

> This is a UX-validation prototype. No real backend, auth, OCR, or PII. All
> sample data (names, SSNs, account numbers, balances) is synthetic.
