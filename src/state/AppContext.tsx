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

interface AppState {
  analyses: Analysis[];
  user: string;
  tenantId: string;
  // PII reveal toggle. Default false => identifiers are masked everywhere.
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
  const [reveal, setReveal] = useState(false);

  // Persist on every change (SEAM 4 mock backend write).
  useEffect(() => {
    saveAnalyses(analyses);
  }, [analyses]);

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

  const finalize = useCallback((analysisId: string) => {
    setAnalyses((prev) =>
      prev.map((a) => {
        if (a.id !== analysisId) return a;
        const method = a.method ?? defaultMethodFor(a.module, a.documents);
        return touch({
          ...a,
          status: "finalized",
          result: a.result ?? runCalculation(a.documents, method),
        });
      }),
    );
  }, []);

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
    setReveal(false);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      analyses,
      user: MOCK_USER,
      tenantId: "4821",
      reveal,
      setReveal,
      getAnalysis,
      createAnalysis,
      addDocument,
      updateField,
      resetField,
      setMethod,
      recalc,
      setStatus,
      finalize,
      addNote,
      resetDemoData,
    }),
    [
      analyses,
      reveal,
      getAnalysis,
      createAnalysis,
      addDocument,
      updateField,
      resetField,
      setMethod,
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
