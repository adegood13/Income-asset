import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Clone the app's stylesheets + font links into the popped window so it looks
// identical. Works in dev (Vite injects <style>) and prod (<link rel=stylesheet>).
function copyStyles(src: Document, dst: Document) {
  src.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], style').forEach((node) => {
    dst.head.appendChild(node.cloneNode(true));
  });
}

interface Props {
  title: string;
  onClose: () => void;
  onReturn: () => void;
  children: ReactNode;
  width?: number;
  height?: number;
}

/**
 * Renders `children` into a separate browser window via a portal. Because it's a
 * portal, the popped content stays part of the same React tree — it shares app
 * state/context and updates live in both windows. Closing the window (or the
 * Return button) calls back to re-dock the panel.
 */
export function PopoutWindow({ title, onClose, onReturn, children, width = 520, height = 880 }: Props) {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const left = Math.max(0, (window.screen.availWidth ?? 1200) - width - 40);
    const win = window.open("", "", `width=${width},height=${height},left=${left},top=80`);
    if (!win) {
      alert("Pop-up blocked. Allow pop-ups for this site to use pop-out panels.");
      onClose();
      return;
    }
    win.document.title = `AskBobAI · ${title}`;
    copyStyles(document, win.document);
    win.document.body.style.margin = "0";

    const container = win.document.createElement("div");
    container.className = "min-h-screen bg-ink-50";
    win.document.body.appendChild(container);
    setMount(container);

    // Re-dock if the user closes the window directly.
    const poll = window.setInterval(() => {
      if (win.closed) {
        window.clearInterval(poll);
        onClose();
      }
    }, 400);
    // Close the popup if the main window goes away.
    const closeOnMainUnload = () => win.close();
    window.addEventListener("beforeunload", closeOnMainUnload);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("beforeunload", closeOnMainUnload);
      try {
        win.close();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mount) return null;

  return createPortal(
    <div className="flex min-h-screen flex-col">
      {/* Popped-window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-2.5">
        <span className="eyebrow">{title} · popped out</span>
        <button className="btn-secondary px-3 py-1.5 text-xs" onClick={onReturn}>
          Return to main window
        </button>
      </div>
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </div>,
    mount,
  );
}
