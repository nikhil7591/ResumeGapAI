"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Review } from "@/types";

export type WorkspaceTabId =
  | "overview"
  | "gaps"
  | "content"
  | "ats"
  | "suggestions"
  | "strengths"
  | "interview"
  | "summary";

interface ReviewWorkspaceContextValue {
  currentReview: Review | null;
  setCurrentReview: (review: Review | null) => void;
  activeTab: WorkspaceTabId;
  setActiveTab: (tab: WorkspaceTabId) => void;
}

const ReviewWorkspaceContext = createContext<ReviewWorkspaceContextValue | undefined>(undefined);

export function ReviewWorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("overview");

  return (
    <ReviewWorkspaceContext.Provider
      value={{ currentReview, setCurrentReview, activeTab, setActiveTab }}
    >
      {children}
    </ReviewWorkspaceContext.Provider>
  );
}

export function useReviewWorkspace() {
  const ctx = useContext(ReviewWorkspaceContext);
  if (!ctx) throw new Error("useReviewWorkspace must be used within a ReviewWorkspaceProvider");
  return ctx;
}
