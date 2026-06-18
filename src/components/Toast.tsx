import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastCtx = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-float animate-fade-in"
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green" />
            ) : (
              <Info className="h-5 w-5 shrink-0 text-brand" />
            )}
            <span className="flex-1 text-sm font-medium text-ink-700">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
