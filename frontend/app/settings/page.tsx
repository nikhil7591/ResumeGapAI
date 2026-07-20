"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/lib/theme-context";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <ProtectedRoute>
      <main className="bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Adjust the app appearance and access account-related preferences.
          </p>

          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Appearance</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Toggle between light and dark mode for the workspace.
              </p>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current mode: {theme}</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Switch theme
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Account preferences</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Billing</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage your plan, subscription status, or cancellation.
                  </p>
                  <a
                    href="/billing"
                    className="mt-3 inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Open billing
                  </a>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Privacy</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Review your stored resume, JD, and review history from the dashboard.
                  </p>
                  <a
                    href="/dashboard"
                    className="mt-3 inline-flex rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Go to dashboard
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}