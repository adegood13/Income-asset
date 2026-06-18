/* =============================================================================
 * SEAM 4 — PERSISTENCE  (MOCK)
 * -----------------------------------------------------------------------------
 * MOCK. Production replaces this with the real backend: the append-only audit
 * store, authn/authz, and multi-user concurrency. Here everything lives in the
 * browser's localStorage so edits survive a refresh while you click around.
 *
 * The public surface (load / saveAll / upsert / etc.) is intentionally small
 * and async-shaped where it matters so swapping in real network calls is easy.
 * ========================================================================== */

import type { Analysis } from "../types";
import { buildSeedAnalyses, MOCK_USER } from "./seed";

const STORAGE_KEY = "askbob.analyses.v1";
const SEEDED_KEY = "askbob.seeded.v1";

export { MOCK_USER };

// Load all analyses. Seeds sample data on first ever run.
export function loadAnalyses(): Analysis[] {
  try {
    const seeded = localStorage.getItem(SEEDED_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!seeded || raw === null) {
      const seed = buildSeedAnalyses();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      localStorage.setItem(SEEDED_KEY, "1");
      return seed;
    }
    return JSON.parse(raw) as Analysis[];
  } catch (err) {
    // Corrupt storage — fall back to a fresh seed rather than crashing.
    console.warn("[store] failed to load, reseeding", err);
    const seed = buildSeedAnalyses();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      localStorage.setItem(SEEDED_KEY, "1");
    } catch {
      /* ignore */
    }
    return seed;
  }
}

export function saveAnalyses(analyses: Analysis[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch (err) {
    console.warn("[store] failed to save", err);
  }
}

// Wipe everything and restore the seed set (used by Settings "reset demo data").
export function resetToSeed(): Analysis[] {
  const seed = buildSeedAnalyses();
  saveAnalyses(seed);
  localStorage.setItem(SEEDED_KEY, "1");
  return seed;
}
