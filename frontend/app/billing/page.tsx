"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import api, { ApiError } from "@/lib/api";
import { BillingStatus } from "@/types";

function BillingContent() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get("checkout");
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const loadStatus = useCallback(async () => {
    const data = await api.get<BillingStatus>("/billing/status");
    setStatus(data);
  }, []);

  useEffect(() => {
    (async () => {
      // If we just came back from a successful Stripe Checkout, verify the session
      // directly rather than waiting on the webhook (which may be delayed, or in local
      // dev, never arrive if `stripe listen` isn't forwarding events).
      if (checkoutResult === "success" && sessionId) {
        setConfirming(true);
        try {
          const confirmed = await api.post<BillingStatus>(
            `/billing/confirm-session?session_id=${encodeURIComponent(sessionId)}`
          );
          setStatus(confirmed);
          await refreshUser();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Could not confirm your payment.");
          await loadStatus();
        } finally {
          setConfirming(false);
        }
        return;
      }

      await loadStatus();
      if (checkoutResult === "success") {
        await refreshUser();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async () => {
    setError(null);
    setBusy(true);
    try {
      const { checkout_url } = await api.post<{ checkout_url: string }>(
        "/billing/create-checkout-session"
      );
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.post("/billing/cancel-subscription");
      await Promise.all([loadStatus(), refreshUser()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel subscription.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-6 py-10 pb-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Billing & account</h1>

        {checkoutResult === "success" && (
          <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
            {confirming
              ? "Payment successful — confirming your subscription..."
              : "Payment confirmed — your plan is up to date below."}
          </p>
        )}
        {checkoutResult === "cancelled" && (
          <p className="mt-4 rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
            Checkout was cancelled — no changes were made.
          </p>
        )}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current plan</p>
              <p className="text-xl font-bold uppercase text-gray-900 dark:text-gray-50">
                {status?.plan ?? user?.plan ?? "..."}
              </p>
            </div>
            {status?.subscription_status && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {status.subscription_status}
              </span>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6">
            {status?.plan === "free" ? (
              <button
                onClick={handleUpgrade}
                disabled={busy}
                className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? "Redirecting..." : "Upgrade to Pro — $9/month"}
              </button>
            ) : (
              <button
                onClick={handleCancel}
                disabled={busy}
                className="rounded-md border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                {busy ? "Cancelling..." : "Cancel subscription"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
          Payments are processed by Stripe in test mode. Use card number 4242 4242 4242 4242, any
          future expiry, and any CVC to simulate a successful payment.
        </p>
      </div>
    </main>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <Suspense>
        <BillingContent />
      </Suspense>
    </ProtectedRoute>
  );
}
