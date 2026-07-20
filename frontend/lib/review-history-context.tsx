"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ReviewListItem } from "@/types";

interface ReviewHistoryContextValue {
  history: ReviewListItem[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const ReviewHistoryContext = createContext<ReviewHistoryContextValue | undefined>(undefined);

export function ReviewHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    try {
      const data = await api.get<ReviewListItem[]>("/reviews");
      setHistory(data);
    } catch (err) {
      setHistory([]);
    }
  }, [user]);

  // History is per-user: refetch whenever auth state changes (login/logout), not just on mount.
  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  return (
    <ReviewHistoryContext.Provider value={{ history, loading, refresh }}>
      {children}
    </ReviewHistoryContext.Provider>
  );
}

export function useReviewHistory() {
  const ctx = useContext(ReviewHistoryContext);
  if (!ctx) throw new Error("useReviewHistory must be used within a ReviewHistoryProvider");
  return ctx;
}
