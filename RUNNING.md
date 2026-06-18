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
2. **New analysis** → pick Income or Asset, auto-generate or type a loan number,
   "upload" a sample document (mock ~1s extraction), and land in the workspace.
3. **Workspace** (the centerpiece, three columns):
   - *Documents* (left) — switch between attached docs, add another.
   - *Data points* (center) — every captured field with a **confidence badge**,
     a provenance hint, and an editable value. Edit a financial field and watch
     it flag as **overridden** (with a "was…" original and a reset). Add a
     per-field note. Identifier fields are masked until you toggle PII reveal.
   - *Calculation* (right) — the qualifying figure, a **method dropdown** (switch
     it and the number + lineage change), the **step-by-step audit lineage**,
     Recalculate, and a disabled "Apply agency guidelines · Coming soon" stub.
   - Header actions: **Save**, **Finalize** (locks the analysis), **Export**
     (printable worksheet or JSON), and an append-only **Notes** drawer.
4. **PII mask toggle** (top bar) — flips identifier masking everywhere. Off by
   default (identifiers masked).
5. **Reports** → mock charts (volume by status, confidence distribution,
   override rate over time, average turn time) with a date-range filter and CSV
   export.
6. **Settings** → placeholder list of areas "configured by engineering".

## The four mock "seams" (engineering handoff)

Each file below is the single, clearly-labeled place where the prototype fakes a
production system. Each starts with a comment block describing what production
replaces it with.

| Seam | File | What it fakes | Production replaces with |
|------|------|---------------|--------------------------|
| 1 | `src/mock/extraction.ts` | Document upload + OCR + field extraction. Returns pre-baked `DocumentRecord`s with per-field confidence. | The real extraction API. |
| 2 | `src/mock/rules.ts` | Calculation. Hardcoded methods that read field values and return a `CalculationResult` whose `steps[]` are the audit lineage. | The real versioned, per-tenant rules engine. |
| 3 | `src/mock/tokenization.ts` | PII masking for identifier fields + the global reveal toggle. | The real tokenization vault + detokenization service. |
| 4 | `src/mock/store.ts` | `localStorage`-backed persistence for analyses and notes (seeded from `src/mock/seed.ts`). | The real backend, append-only audit store, and auth. |

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
