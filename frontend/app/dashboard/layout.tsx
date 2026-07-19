"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import { ReviewWorkspaceProvider } from "@/lib/review-workspace-context";

export default function DashboardAppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <ReviewWorkspaceProvider>
        <div className="flex min-h-[calc(100vh-65px)] bg-gray-50 dark:bg-gray-950">
          <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="rounded-md border border-gray-300 p-2 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              >
                ☰
              </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Menu</span>
            </div>

            {children}
          </div>
        </div>
      </ReviewWorkspaceProvider>
    </ProtectedRoute>
  );
}
