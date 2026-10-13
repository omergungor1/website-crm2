"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dashboard-sidebar-collapsed";
const WIDTH_EXPANDED = "15rem";
const WIDTH_COLLAPSED = "0px";

const DashboardChromeContext = createContext({
  collapsed: false,
  sidebarHidden: false,
  toggleCollapsed: () => {},
  setCollapsed: () => {},
});

export function useDashboardChrome() {
  return useContext(DashboardChromeContext);
}

function readStoredCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function DashboardChromeProvider({ children }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsedState(readStoredCollapsed());
    setHydrated(true);
  }, []);

  const setCollapsed = useCallback((next) => {
    setCollapsedState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const sidebarHidden = collapsed;
  const sidebarWidth = sidebarHidden ? WIDTH_COLLAPSED : WIDTH_EXPANDED;

  const value = useMemo(
    () => ({
      collapsed,
      sidebarHidden,
      hydrated,
      toggleCollapsed,
      setCollapsed,
    }),
    [collapsed, sidebarHidden, hydrated, toggleCollapsed, setCollapsed]
  );

  return (
    <DashboardChromeContext.Provider value={value}>
      <div
        className="min-h-screen bg-[var(--app-bg)] text-zinc-900 transition-[padding] duration-200 dark:bg-zinc-950 dark:text-zinc-50 [--dashboard-topbar-height:3.5rem] [--dashboard-header-height:var(--dashboard-topbar-height)]"
        style={{
          ["--dashboard-sidebar-width"]: sidebarWidth,
        }}
      >
        {children}
      </div>
    </DashboardChromeContext.Provider>
  );
}
