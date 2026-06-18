import { useState } from "react";
import { X, Lock, ShieldCheck } from "lucide-react";
import type { Analysis } from "../types";
import { useApp } from "../state/AppContext";
import { formatDateTime } from "../lib/format";

interface Props {
  analysis: Analysis;
  open: boolean;
  onClose: () => void;
}

export function NotesDrawer({ analysis, open, onClose }: Props) {
  const { addNote, user } = useApp();
  const [draft, setDraft] = useState("");

  const submit = () => {
    if (!draft.trim()) return;
    addNote(analysis.id, draft);
    setDraft("");
  };

  if (!open) return null;
  const notes = [...analysis.notes].reverse();

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-surface shadow-float">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-navy">Analysis notes</h2>
            <p className="font-mono text-xs text-ink-500">{analysis.loanNumber}</p>
          </div>
          <button onClick={onClose} className="btn-ghost px-2" aria-label="Close notes">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Append-only disclaimer */}
        <div className="flex items-center gap-2 border-b border-ink-100 bg-green-tint/50 px-5 py-2.5 text-xs text-green-deep">
          <ShieldCheck className="h-3.5 w-3.5" />
          Append-only audit trail. Notes can be added but never edited or deleted.
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 scroll-thin">
          {notes.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-400">No notes yet. Add the first one below.</p>
          )}
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-ink-200 bg-ink-50 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">
                    {n.author.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </div>
                  <span className="text-sm font-semibold text-navy">{n.author}</span>
                </div>
                <span className="flex items-center gap-1 font-mono text-[11px] text-ink-400">
                  <Lock className="h-3 w-3" />
                  {formatDateTime(n.timestamp)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{n.body}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-ink-200 p-4">
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder={`Add a note as ${user}…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-ink-400">⌘/Ctrl + Enter to post</span>
            <button className="btn-primary" onClick={submit} disabled={!draft.trim()}>
              Add note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
