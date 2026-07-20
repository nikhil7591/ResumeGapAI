"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

function getInitials(email?: string | null) {
  if (!email) return "U";
  const [localPart] = email.split("@");
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <main className="bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Profile</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View your account identity and current subscription details.
          </p>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
                {getInitials(user?.email)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account email</p>
                <p className="truncate text-xl font-semibold text-gray-900 dark:text-gray-50">
                  {user?.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">Plan: {user?.plan}</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                    Status: {user?.subscription_status ?? "not set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">What you can do here</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Review your profile identity.</li>
                  <li>• Jump to billing if you want to change plans.</li>
                  <li>• Check the plan and subscription status tied to your account.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Quick actions</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href="/billing"
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Manage billing
                  </a>
                  <a
                    href="/dashboard"
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                  >
                    Back to dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}