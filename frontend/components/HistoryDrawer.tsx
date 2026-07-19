"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReviewHistory } from "@/lib/review-history-context";
import { useHistoryDrawer } from "@/lib/history-drawer-context";

export default function HistoryDrawer() {
  const pathname = usePathname();
  const { history, loading } = useReviewHistory();
  const { isOpen, close } = useHistoryDrawer();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
      />

      {/* Right-side drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col border-l border-gray-200 bg-white shadow-xl transition-transform dark:border-gray-800 dark:bg-gray-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Review History</h2>
          <button
            onClick={close}
            aria-label="Close history"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading && <p className="px-2 py-2 text-sm text-gray-400 dark:text-gray-500">Loading...</p>}

          {!loading && history.length === 0 && (
            <p className="px-2 py-2 text-sm text-gray-400 dark:text-gray-500">
              No reviews yet — run your first one from Dashboard.
            </p>
          )}

          <div className="space-y-1">
            {history.map((review) => {
              const isActive = pathname === `/dashboard/reviews/${review.id}`;
              return (
                <Link
                  key={review.id}
                  href={`/dashboard/reviews/${review.id}`}
                  onClick={close}
                  title={review.summary}
                  className={`block truncate rounded-lg px-3 py-2 text-sm ${
                    isActive
                      ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="block truncate">{review.summary || "Resume review"}</span>
                  <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()} · {review.match_score}/100
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
