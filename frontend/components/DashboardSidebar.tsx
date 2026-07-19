"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useReviewWorkspace, WorkspaceTabId } from "@/lib/review-workspace-context";

const tabs: { id: WorkspaceTabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "gaps", label: "Gap Analysis", icon: "🧩" },
  { id: "content", label: "Content Review", icon: "📝" },
  { id: "ats", label: "ATS Score", icon: "⏱️" },
  { id: "suggestions", label: "Suggestions", icon: "💡" },
  { id: "strengths", label: "Strengths", icon: "🛡️" },
  { id: "interview", label: "Interview Prep", icon: "🎤" },
  { id: "summary", label: "Summary", icon: "📄" },
];

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentReview, activeTab, setActiveTab } = useReviewWorkspace();

  const isDashboardActive = pathname === "/dashboard";
  const isOnReviewPage = pathname?.startsWith("/dashboard/reviews/") ?? false;

  return (
    <>
      {/* Mobile-only backdrop */}
      {mobileOpen && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/30 lg:hidden" aria-hidden />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-gray-200 bg-white p-3 transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-1 flex items-center justify-between lg:hidden">
          <span className="px-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <Link
          href="/dashboard"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
            isDashboardActive
              ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
              : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isDashboardActive
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            🏠
          </span>
          Dashboard
        </Link>

        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 dark:border-gray-800">
          {tabs.map((tab) => {
            const isInterviewLocked = tab.id === "interview" && currentReview?.plan_at_time !== "pro";
            const disabled = !currentReview || isInterviewLocked;
            const isActive = isOnReviewPage && !disabled && activeTab === tab.id;

            const disabledReason = !currentReview
              ? "Run a resume review from Dashboard first to unlock this section."
              : isInterviewLocked
              ? "Upgrade to Pro to unlock the Interview Readiness Simulator."
              : null;

            const handleClick = () => {
              if (disabled || !currentReview) return;
              setActiveTab(tab.id);
              if (pathname !== `/dashboard/reviews/${currentReview.id}`) {
                router.push(`/dashboard/reviews/${currentReview.id}`);
              }
              onClose();
            };

            return (
              <div key={tab.id} className="group relative">
                <button
                  onClick={handleClick}
                  aria-disabled={disabled}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                    disabled
                      ? "cursor-not-allowed text-gray-300 dark:text-gray-700"
                      : isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      disabled
                        ? "bg-gray-50 dark:bg-gray-900"
                        : isActive
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                </button>

                {disabledReason && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-56 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700 lg:left-full lg:top-1/2 lg:ml-2 lg:mt-0 lg:-translate-y-1/2"
                  >
                    {disabledReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
