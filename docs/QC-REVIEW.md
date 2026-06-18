# QC Review — Security, SOC 2 posture, scalability

_Prototype: AskBobAI Income & Asset Analysis. Reviewed as part of the QC pass._

## Scope & honest framing

This is a **front-end-only prototype**. Everything that would touch real data is
mocked behind labelled seams (`src/mock/*`). Two things follow from that:

1. **A client-only app cannot itself be SOC 2 compliant.** SOC 2 is about the
   _service organization’s_ controls — backend access control, encryption,
   logging, change management, vendor management, monitoring. Those live in the
   production system that replaces the seams, not in this bundle.
2. What this prototype _can_ do — and now does — is **demonstrate the control
   surfaces an auditor expects** (RBAC on sensitive actions, audit logging of
   privileged events, least-privilege defaults, no real PII) and **document the
   production requirements** so the build is shaped for SOC 2 from day one.

No real PII exists anywhere in this app. All names, SSNs, account numbers, and
balances are synthetic.

## Findings & fixes (this pass)

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | **High** | **Stored-XSS** in the printable worksheet (`lib/export.ts`) and source-document viewer (`mock/documentViewer.ts`): user-editable field values, notes, loan numbers were interpolated into HTML written to a new window without escaping. | **Fixed** — all dynamic values escaped via `lib/html.ts#escapeHtml`. |
| 2 | Medium | No security headers on the deployed site. | **Fixed** — `netlify.toml` adds CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS. CSP keeps `script-src 'self'` (the theme bootstrap is an external file, not inline). |
| 3 | Medium | PII reveal had no authorization. | **Fixed** — gated by the `pii:reveal` permission (RBAC, `mock/roles.ts`); denied roles can’t unmask, and switching to a role without it re-masks immediately. |
| 4 | Medium | No audit trail for privileged actions. | **Fixed** — append-only audit log (`mock/audit.ts`) records PII reveal/mask, finalize, and role changes; surfaced in Settings → Security. |
| 5 | Low | Editing/finalizing weren’t role-aware. | **Fixed** — `analysis:edit` / `analysis:finalize` gate the workspace (auditor = read-only, processor can’t finalize). |
| 6 | Low | XSS-via-`window.open` documents inherit opener context. | Mitigated by escaping (#1); documents are static, script-free. |

## RBAC model (mock — production enforces server-side)

Defined in `src/mock/roles.ts`. **The UI gate is for UX only; never trust the
client.** Production must re-check every permission on the server for every
request.

| Role | Reveal PII | Edit | Finalize | Manage settings |
|------|:--:|:--:|:--:|:--:|
| Senior Underwriter | ✅ | ✅ | ✅ | — |
| Loan Processor | — | ✅ | — | — |
| Compliance Auditor | — | — | — | — |
| Administrator | ✅ | ✅ | ✅ | ✅ |

## SOC 2 readiness — what production must implement

These map to the Trust Services Criteria. The seams are where each plugs in.

- **Access control (CC6.1–6.3):** real authn (SSO/OIDC), server-enforced RBAC,
  least privilege, session management. _Seam:_ `mock/roles.ts`, `mock/store.ts`.
- **PII protection / confidentiality (C1, CC6.7):** tokenization vault;
  detokenization gated by permission **and** logged; encryption in transit (TLS,
  HSTS set) and at rest. _Seam:_ `mock/tokenization.ts`. **Do not** store PII in
  `localStorage` or any client storage in production.
- **Audit logging & monitoring (CC7.2):** append-only, tamper-evident,
  server-side audit store with retention; alerting on anomalous PII access.
  _Seam:_ `mock/audit.ts` (currently localStorage — illustrative only).
- **Change management (CC8.1):** the calculation rules are versioned per tenant;
  finalized analyses must be immutable, signed records. _Seam:_ `mock/rules.ts`.
- **Integrity:** notes are append-only; finalize locks an analysis. Production
  writes these as immutable records.

## Scalability notes

Prototype constraints that production replaces (all behind seams):

- **Persistence:** `localStorage` (single browser, ~5 MB, synchronous). Replace
  with the backend API + database; paginate the analyses list and reports rather
  than loading all rows into memory.
- **Calculations:** run synchronously in the browser. Fine for the prototype;
  production runs them in the versioned rules engine, ideally server-side, with
  caching of results per (documents, method, guideline) version.
- **Bundle:** ~185 KB gzipped, dominated by `recharts`. If startup matters,
  code-split the Reports route (`React.lazy`) so charts load on demand.
- **Reports:** metrics are computed client-side over the full set with `useMemo`.
  At scale, move aggregation server-side.

## Code-quality QC (general)

- Type-safe (`tsc --noEmit` clean, `strict` on, no `any` escapes in app code).
- No `dangerouslySetInnerHTML`; the only raw-HTML sinks are the two `window.open`
  documents, now escaped.
- Errors handled around `localStorage` (corrupt-store fallback reseed).
- Accessibility: visible keyboard focus, `prefers-reduced-motion` respected,
  ARIA labels on icon-only controls, WCAG-AA-minded contrast (incl. dark mode).
- Theme: dark mode via CSS-variable palette flip; no flash (external bootstrap).

## Residual / follow-ups (not blocking the prototype)

- Recharts axis grid/tooltip use fixed light colors; fine but could be themed for
  a more polished dark mode.
- Pop-out panels use a React portal into a second window; verify interactivity in
  target browsers (no automated browser available in this environment).
- Add automated tests (unit for `rules.ts`/`tokenization.ts`, a CSP smoke test)
  when this graduates past prototype.
