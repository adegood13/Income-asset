// Minimal hash-based router — keeps the dependency list to the spec's stack.
// Routes:
//   #/                  dashboard
//   #/income            income analyses list
//   #/asset             asset analyses list
//   #/analysis/:id      analysis workspace
//   #/reports           reports
//   #/settings          settings
import { useEffect, useState } from "react";

export type Route =
  | { name: "dashboard" }
  | { name: "list"; module: "income" | "asset" }
  | { name: "analysis"; id: string }
  | { name: "reports" }
  | { name: "settings" };

function parse(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "dashboard" };
  switch (parts[0]) {
    case "income":
      return { name: "list", module: "income" };
    case "asset":
      return { name: "list", module: "asset" };
    case "analysis":
      return parts[1] ? { name: "analysis", id: parts[1] } : { name: "dashboard" };
    case "reports":
      return { name: "reports" };
    case "settings":
      return { name: "settings" };
    default:
      return { name: "dashboard" };
  }
}

export function navigate(path: string): void {
  const target = path.startsWith("#") ? path : `#${path}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
  // Always jump to top on navigation.
  window.scrollTo({ top: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
