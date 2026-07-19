"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface HistoryDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const HistoryDrawerContext = createContext<HistoryDrawerContextValue | undefined>(undefined);

export function HistoryDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <HistoryDrawerContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </HistoryDrawerContext.Provider>
  );
}

export function useHistoryDrawer() {
  const ctx = useContext(HistoryDrawerContext);
  if (!ctx) throw new Error("useHistoryDrawer must be used within a HistoryDrawerProvider");
  return ctx;
}
