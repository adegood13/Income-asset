import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-slide-in">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="lg:pl-64">
        <TopBar onOpenMenu={() => setMobileOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
}
