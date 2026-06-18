import { AppProvider } from "./state/AppContext";
import { ToastProvider } from "./components/Toast";
import { AppShell } from "./components/AppShell";
import { useRoute } from "./state/router";
import { Dashboard } from "./pages/Dashboard";
import { AnalysisList } from "./pages/AnalysisList";
import { AnalysisWorkspace } from "./pages/AnalysisWorkspace";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";

function Router() {
  const route = useRoute();
  switch (route.name) {
    case "dashboard":
      return <Dashboard />;
    case "list":
      return <AnalysisList module={route.module} />;
    case "analysis":
      return <AnalysisWorkspace id={route.id} />;
    case "reports":
      return <Reports />;
    case "settings":
      return <Settings />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppShell>
          <Router />
        </AppShell>
      </ToastProvider>
    </AppProvider>
  );
}
