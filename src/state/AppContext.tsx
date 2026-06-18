// Global app state: the analyses collection, the PII reveal toggle, the mock
// signed-in user, and all the mutation helpers the screens use. Every mutation
// flows through here and is persisted to localStorage (SEAM 4) via an effect.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Analysis,
  AnalysisStatus,
  CapturedField,
  DocumentRecord,
  ModuleKind,
  Note,
} from "../types";
import { loadAnalyses, saveAnalyses, resetToSeed, MOCK_USER } from "../mock/store";
import { defaultMethodFor, runCalculation } from "../mock/rules";
import { uid, generateLoanNumber } from "../lib/id";
import { type Permission, type Role, roleHas } from "../mock/roles";
import { recordAudit } from "../mock/audit";

export type ThemeMode = "light" | "dark" | "system";

const ROLE_KEY = "askbob.role.v1";
const THEME_KEY = "askbob.theme.v1";
const FIELDLOCK_KEY = "askbob.fieldlock.v1";

interface AppState {
  analyses: Analysis[];
  user: string;
  tenantId: string;

  // RBAC (SEAM 6). `can()` gates privileged UI; production enforces server-side.
  role: Role;
  setRole: (role: Role) => void;
  can: (permission: Permission) => boolean;

  // Theme.
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;

  // Admin policy: lock fields whose confidence is >= this score from editing.
  // null = policy off. Changing it requires `settings:manage`.
  confidenceLockThreshold: number | null;
  setConfidenceLockThreshold: (threshold: number | null) => void;

  // PII reveal toggle. Default false => identifiers are masked everywhere.
  // Revealing requires the `pii:reveal` permission and is audit-logged.
  reveal: boolean;
  setReveal: (v: boolean) => void;

  getAnalysis: (id: string) => Analysis | undefined;
  createAnalysis: (module: ModuleKind, loanNumber: string, firstDoc: DocumentRecord) => Analysis;
  addDocument: (analysisId: string, doc: DocumentRecord) => void;
  updateField: (
    analysisId: string,
    docId: string,
    fieldId: string,
    patch: Partial<CapturedField>,
  ) => void;
  resetField: (analysisId: string, docId: string, fieldId: string) => void;
  setMethod: (analysisId: string, methodId: string) => void;
  setGuideline: (analysisId: string, guidelineId: string) => void;
  recalc: (analysisId: string) => void;
  setStatus: (analysisId: string, status: AnalysisStatus) => void;
  finalize: (analysisId: string) => void;
  addNote: (analysisId: string, body: string) => void;
  resetDemoData: () => void;
}

const Ctx = createContext<AppState | null>(null);

const GENERATED_LOAN = generateLoanNumber; // re-export convenience

export function AppProvider({ children }: { children: ReactNode }) {
  const [analyses, setAnalyses] = useState<Analysis[]>(() => loadAnalyses());
  const [revealState, setRevealState] = useState(false);
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem(ROLE_KEY) as Role) || "underwriter",
  );
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (localStorage.getItem(THEME_KEY) as ThemeMode) || "system",
  );
  const [confidenceLockThreshold, setLockThresholdState] = useState<number | null>(() => {
    const raw = localStorage.getItem(FIELDLOCK_KEY);
    return raw === null || raw === "" ? null : Number(raw);
  });

  // Persist on every change (SEAM 4 mock backend write).
  useEffect(() => {
    saveAnalyses(analyses);
  }, [analyses]);

  // Apply the theme to <html> (class strategy), tracking the system preference.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mql.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  const can = useCallback((permission: Permission) => roleHas(role, permission), [role]);

  // Privileged: revealing PII requires permission and is audit-logged.
  const setReveal = useCallback(
    (v: boolean) => {
      if (v && !roleHas(role, "pii:reveal")) return; // denied — no permission
      setRevealState(v);
      recordAudit({
        action: v ? "pii.reveal" : "pii.mask",
        actor: MOCK_USER,
        role,
        detail: v ? "Identifiers unmasked across workspace" : "Identifiers re-masked",
      });
    },
    [role],
  );

  // Switching to a role without pii:reveal immediately re-masks.
  const setRole = useCallback(
    (next: Role) => {
      setRoleState(next);
      localStorage.setItem(ROLE_KEY, next);
      recordAudit({ action: "role.switch", actor: MOCK_USER, role: next, detail: `Acting as ${next}` });
      if (!roleHas(next, "pii:reveal")) setRevealState(false);
    },
    [],
  );

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
  }, []);

  const setConfidenceLockThreshold = useCallback(
    (threshold: number | null) => {
      setLockThresholdState(threshold);
      localStorage.setItem(FIELDLOCK_KEY, threshold == null ? "" : String(threshold));
      recordAudit({
        action: "policy.change",
        actor: MOCK_USER,
        role,
        detail:
          threshold == null
            ? "Field-lock policy disabled"
            : `Fields locked at confidence ≥ ${threshold}%`,
      });
    },
    [role],
  );

  const touch = (a: Analysis): Analysis => ({ ...a, updatedAt: new Date().toISOString() });

  const getAnalysis = useCallback(
    (id: string) => analyses.find((a) => a.id === id),
    [analyses],
  );

  const createAnalysis = useCallback(
    (module: ModuleKind, loanNumber: string, firstDoc: DocumentRecord): Analysis => {
      const now = new Date().toISOString();
      const method = defaultMethodFor(module, [firstDoc]);
      const analysis: Analysis = {
        id: uid("ana"),
        loanNumber: loanNumber.trim() || GENERATED_LOAN(),
        module,
        borrowerName: deriveBorrowerName(firstDoc),
        status: "draft",
        documents: [firstDoc],
        method,
        result: runCalculation([firstDoc], method),
        notes: [],
        createdAt: now,
        updatedAt: now,
      };
      setAnalyses((prev) => [analysis, ...prev]);
      return analysis;
    },
    [],
  );

  const addDocument = useCallback((analysisId: string, doc: DocumentRecord) => {
    setAnalyses((prev) =>
      prev.map((a) => {
        if (a.id !== analysisId) return a;
        const documents = [...a.documents, doc];
        const method = a.method ?? defaultMethodFor(a.module, documents);
        return touch({ ...a, documents, method, result: runCalculation(documents, method) });
      }),
    );
  }, []);

  const updateField = useCallback(
    (analysisId: string, docId: string, fieldId: string, patch: Partial<CapturedField>) => {
      setAnalyses((prev) =>
        prev.map((a) => {
          if (a.id !== analysisId) return a;
          const documents = a.documents.map((d) =>
            d.id !== docId
              ? d
              : {
                  ...d,
                  fields: d.fields.map((field) => {
                    if (field.id !== fieldId) return field;
                    const next = { ...field, ...patch };
                    // Mark overridden when the value changes from the captured original.
                    if (patch.value !== undefined) {
                      next.overridden = String(patch.value) !== String(field.originalValue);
                    }
                    return next;
                  }),
                },
          );
          // Live recalc so the right panel always reflects current inputs.
          const method = a.method ?? defaultMethodFor(a.module, documents);
          return touch({ ...a, documents, result: runCalculation(documents, method) });
        }),
      );
    },
    [],
  );

  const resetField = useCallback((analysisId: string, docId: string, fieldId: string) => {
    setAnalyses((prev) =>
      prev.map((a) => {
        if (a.id !== analysisId) return a;
        const documents = a.documents.map((d) =>
          d.id !== docId
            ? d
            : {
                ...d,
                fields: d.fields.map((field) =>
                  field.id !== fieldId
                    ? field
                    : { ...field, value: field.originalValue, overridden: false },
                ),
              },
        );
        const method = a.method ?? defaultMethodFor(a.module, documents);
        return touch({ ...a, documents, result: runCalculation(documents, method) });
      }),
    );
  }, []);

  const setMethod = useCallback((analysisId: string, methodId: string) => {
    setAnalyses((prev) =>
      prev.map((a) =>
        a.id !== analysisId
          ? a
          : touch({ ...a, method: methodId, result: runCalculation(a.documents, methodId) }),
      ),
    );
  }, []);

  const setGuideline = useCallback((analysisId: string, guidelineId: string) => {
    setAnalyses((prev) =>
      prev.map((a) => (a.id !== analysisId ? a : touch({ ...a, guideline: guidelineId || undefined }))),
    );
  }, []);

  const recalc = useCallback((analysisId: string) => {
    setAnalyses((prev) =>
      prev.map((a) => {
        if (a.id !== analysisId) return a;
        const method = a.method ?? defaultMethodFor(a.module, a.documents);
        const nextStatus: AnalysisStatus = a.status === "finalized" ? "finalized" : "calculated";
        return touch({ ...a, status: nextStatus, result: runCalculation(a.documents, method) });
      }),
    );
  }, []);

  const setStatus = useCallback((analysisId: string, status: AnalysisStatus) => {
    setAnalyses((prev) =>
      prev.map((a) => (a.id !== analysisId ? a : touch({ ...a, status }))),
    );
  }, []);

  const finalize = useCallback(
    (analysisId: string) => {
      setAnalyses((prev) =>
        prev.map((a) => {
          if (a.id !== analysisId) return a;
          const method = a.method ?? defaultMethodFor(a.module, a.documents);
          recordAudit({
            action: "analysis.finalize",
            actor: MOCK_USER,
            role,
            detail: `Finalized ${a.loanNumber}`,
          });
          return touch({
            ...a,
            status: "finalized",
            result: a.result ?? runCalculation(a.documents, method),
          });
        }),
      );
    },
    [role],
  );

  const addNote = useCallback((analysisId: string, body: string) => {
    const note: Note = {
      id: uid("note"),
      author: MOCK_USER,
      timestamp: new Date().toISOString(),
      body: body.trim(),
    };
    setAnalyses((prev) =>
      prev.map((a) => (a.id !== analysisId ? a : touch({ ...a, notes: [...a.notes, note] }))),
    );
  }, []);

  const resetDemoData = useCallback(() => {
    setAnalyses(resetToSeed());
    setRevealState(false);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      analyses,
      user: MOCK_USER,
      tenantId: "4821",
      role,
      setRole,
      can,
      theme,
      setTheme,
      confidenceLockThreshold,
      setConfidenceLockThreshold,
      reveal: revealState,
      setReveal,
      getAnalysis,
      createAnalysis,
      addDocument,
      updateField,
      resetField,
      setMethod,
      setGuideline,
      recalc,
      setStatus,
      finalize,
      addNote,
      resetDemoData,
    }),
    [
      analyses,
      role,
      setRole,
      can,
      theme,
      setTheme,
      confidenceLockThreshold,
      setConfidenceLockThreshold,
      revealState,
      setReveal,
      getAnalysis,
      createAnalysis,
      addDocument,
      updateField,
      resetField,
      setMethod,
      setGuideline,
      recalc,
      setStatus,
      finalize,
      addNote,
      resetDemoData,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Pull the primary borrower name off a freshly-extracted document.
function deriveBorrowerName(doc: DocumentRecord): string {
  const f = doc.fields.find(
    (x) =>
      x.type === "identifier" &&
      (x.label.toLowerCase().includes("name") || x.label.toLowerCase().includes("holder")),
  );
  return f ? String(f.value) : "New Borrower";
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
