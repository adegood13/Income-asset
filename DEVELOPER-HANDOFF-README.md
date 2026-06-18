# Developer Handoff: Income & Asset Calculator Prototype

## What this is

This is a front-end prototype of a mortgage income and asset calculation platform, built with Claude Code for UX validation. It runs entirely in the browser on mock data. There is no backend, no auth, no database, and no real document processing. Treat the UI and the interaction model as the reference for what we are building. Treat everything behind the UI as a placeholder.

The full target architecture is in `income-asset-platform-architecture.md`. Read that first. This README explains what is built, what is faked, and where you pick up.

## How to run it

```
npm install
npm run dev
```

See `RUNNING.md` in the project root for anything Claude Code added.

## What is real here, and what is not

Real, and worth treating as the spec for the product:
- The assist-mode workflow. Documents come in, every captured data point is shown with a confidence score, the user can see and adjust any value, the system calculates, and the user reviews a step-by-step breakdown before finalizing.
- The component structure for both modules. Income and Assets share one shell and one set of components. They are the same engine with different inputs. Keep that.
- Confidence scoring surfaced next to every field, color coded.
- Field-level and analysis-level notes, append only.
- Override behavior: edits are marked, the original captured value is retained.
- PII masking on identifier fields with a reveal toggle.
- The shape of export and reporting.

Faked, and not safe for anything real:
- No authentication, no authorization, no multi-tenancy enforcement. The tenant indicator is cosmetic.
- No real PII protection. Masking is string manipulation in the browser. Real values would be sitting in `localStorage` if this were real data, which is exactly why you only ever put fake data in it.
- No real extraction, no real calculation logic, no audit trail, no immutability. "Finalize" just flips a status field.
- Persistence is `localStorage`. There is no server.

Do not point this at real borrower data. Do not ship it. It exists to align us on UX.

## The four seams

Claude Code isolated every backend behavior behind a labeled mock module. These are your insertion points. Each file has a comment block at the top describing what production replaces it with.

1. `src/mock/extraction.ts`
   Fakes document extraction by returning pre-baked records with confidence scores. **Replace with** calls to our extraction API. Map the API response into the canonical `DocumentRecord` shape the UI already consumes. Keep confidence scores per field, since the whole assist-mode UX depends on them.

2. `src/mock/rules.ts`
   A handful of hardcoded calculation functions. **Replace with** the real rules engine: per-tenant, versioned, immutable, deterministic. The UI expects a `CalculationResult` with a method label and an ordered list of steps. The step list is the lineage we show the underwriter and store for audit, so the real engine must emit it, not just the final number.

3. `src/mock/tokenization.ts`
   Browser-side string masking plus the reveal toggle. **Replace with** the tokenization vault and a narrow, audited detokenization path. In production, identifiers are tokenized at ingestion and the UI works on tokens and masked values. Detokenization is server side, permissioned, and logged. Financial values are never tokenized, which is why the UI already shows them in the clear.

4. `src/mock/store.ts`
   `localStorage` persistence. **Replace with** the real backend: the transactional store for workflow state, the append-only and hash-chained calculation record store for audit, and snapshotting of inputs at calc time. Notes and overrides are part of the audit record, not loose UI state.

## Production gap checklist

Roughly in dependency order:

1. Stand up the backend and replace `store.ts`. Workflow state in the transactional store, calc records append only and immutable.
2. Wire `extraction.ts` to the real extraction API, including the confidence threshold that decides which fields get flagged for human confirmation.
3. Build the rules engine and replace `rules.ts`. Declarative, sandboxed, versioned. Every calc pins its rule version. Use decimal math, never floats. Make rounding a configurable rule.
4. Stand up the tokenization vault and replace `tokenization.ts`. Per-tenant keys, KMS managed. Audit every detokenization.
5. Add auth, RBAC, and multi-tenant isolation. Tenant scoping on every query, per-tenant encryption keys.
6. Make the calculation record store real: snapshot inputs at calc time, capture full lineage, hash-chain records, attach notes and overrides to the record.
7. Build real export (a worksheet that mirrors what underwriters expect, plus structured output) and real reporting off a separate read model.
8. SOC 2 posture: encryption at rest and in transit, access logging separate from the calc audit trail, least privilege, retention and residency policies.

## Things the prototype deliberately gets right that we must preserve

- Confidence scoring is not decoration. It drives the assist-mode trust model. Keep it everywhere a captured value appears.
- The step-by-step calculation breakdown is the audit story made visible. The real engine has to produce it.
- Income and Assets are one platform with two modules. Do not let them fork into two codebases.
- Notes and overrides are append only because they are audit records. Carry that into the backend.

## On the horizon, designed for but not built

There is a disabled "Apply agency guidelines" toggle in the calculation panel. That is the seam for connecting this to our guideline intelligence later, so a calculation can take agency guidelines into account and cite why a number was treated the way it was. It does nothing today. Leave the seam in.
