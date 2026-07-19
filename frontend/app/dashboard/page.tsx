"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReviewForm from "@/components/ReviewForm";
import { useReviewWorkspace } from "@/lib/review-workspace-context";
import { useReviewHistory } from "@/lib/review-history-context";
import api from "@/lib/api";
import { Review, Usage } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { setCurrentReview, setActiveTab } = useReviewWorkspace();
  const { refresh } = useReviewHistory();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  // Landing on the Dashboard page means "no review in view" — clear it so the sidebar's
  // workspace tabs go back to their disabled state until a new analysis is run.
  useEffect(() => {
    setCurrentReview(null);
  }, [setCurrentReview]);

  useEffect(() => {
    (async () => {
      const data = await api.get<Usage>("/reviews/usage");
      setUsage(data);
      setLoadingUsage(false);
    })();
  }, []);

  const handleCreated = async (review: Review) => {
    setCurrentReview(review);
    setActiveTab("overview");
    await refresh();
    router.push(`/dashboard/reviews/${review.id}`);
  };

  const atLimit = usage !== null && usage.plan === "free" && usage.used_today >= usage.limit;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Run a resume review</h1>
      {usage && usage.plan === "free" && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {usage.used_today}/{usage.limit} free reviews used today.
        </p>
      )}

      <div className="mt-6">
        {!loadingUsage && (
          <ReviewForm
            onCreated={handleCreated}
            disabled={atLimit}
            disabledReason={
              atLimit
                ? "You've hit today's free review limit. Upgrade to Pro for unlimited reviews."
                : undefined
            }
          />
        )}
      </div>
    </main>
  );
}
