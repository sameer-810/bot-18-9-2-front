import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Sidebar open/closed state.
 *   - desktop (md+): "expanded" | "collapsed-to-icons"  → push layout
 *   - mobile (<md):  "drawer-open" | "drawer-closed"    → overlay
 * Persisted to localStorage so reload remembers the preference.
 */

type SidebarContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);
const STORAGE_KEY = "waagent_sidebar_open";

function readInitial(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return window.matchMedia?.("(min-width: 768px)").matches ?? true;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState<boolean>(() => readInitial());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  const value: SidebarContextValue = {
    open,
    setOpen: setOpenState,
    toggle: () => setOpenState((v) => !v),
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>");
  return ctx;
}
