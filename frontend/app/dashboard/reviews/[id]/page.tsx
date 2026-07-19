"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReviewWorkspaceContent from "@/components/ReviewWorkspaceContent";
import { useReviewWorkspace } from "@/lib/review-workspace-context";
import api, { ApiError } from "@/lib/api";
import { Review } from "@/types";
import { downloadReport } from "@/lib/report";

export default function ReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const { currentReview, setCurrentReview, activeTab, setActiveTab } = useReviewWorkspace();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setActiveTab("overview");

    (async () => {
      try {
        const data = await api.get<Review>(`/reviews/${params.id}`);
        setCurrentReview(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load this review.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const review = currentReview && currentReview.id === params.id ? currentReview : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-16 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Review detail</h1>
        {review && (
          <button
            onClick={() => downloadReport(review)}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ⬇ Download Report
          </button>
        )}
      </div>

      {loading && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {review && (
        <div className="mt-6 space-y-6">
          <details className="group rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900 dark:text-gray-100">
              Job description
              <span className="text-gray-400 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 whitespace-pre-wrap">{review.jd_text}</p>
          </details>

          <ReviewWorkspaceContent review={review} activeTab={activeTab} onSelectTab={setActiveTab} />
        </div>
      )}
    </main>
  );
}
