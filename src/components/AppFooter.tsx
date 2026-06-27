// Near-black branded footer (Ink / Night Ink per the brand guide — "Ink carries
// the message"). Fixed dark in both themes, matching the sidebar surface, with
// the wordmark, an honest prototype disclaimer, and the brand color trio.

import { LogoMark, Wordmark } from "./Logo";

export function AppFooter() {
  return (
    <footer className="mt-12 bg-surface-dark text-ink-400">
      <div className="mx-auto max-w-[1400px] px-4 py-9 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoMark size={34} />
            <div>
              <Wordmark light />
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                Income &amp; Assets
              </p>
            </div>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-ink-500">
            A UX-validation prototype. Extraction, rules, tokenization, and persistence are
            mocked behind clearly-labeled seams — no real backend, OCR, or PII. All sample
            data is synthetic.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-ink-500">
          <span>© 2026 AskBobAI · Brand Edition 01</span>
          <span className="inline-flex items-center gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="h-2 w-2 rounded-full bg-brand-bright" />
            <span className="h-2 w-2 rounded-full bg-green" />
          </span>
        </div>
      </div>
    </footer>
  );
}
