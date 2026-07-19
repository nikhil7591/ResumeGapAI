"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api, { ApiError } from "@/lib/api";

const starterFeatures = [
  "3 resume reviews per day",
  "Match score (0-100)",
  "Gap & weak-area list",
  "Review history",
];

const proFeatures = [
  "Unlimited resume reviews",
  "Match score (0-100)",
  "Gap & weak-area list",
  "Interview Readiness Simulator",
  "Predicted questions + answer outlines",
  "Review history",
];

export default function PricingTable() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProClick = async () => {
    if (loading) return;

    if (!user) {
      router.push("/signup?plan=pro");
      return;
    }
    if (user.plan === "pro") {
      router.push("/billing");
      return;
    }

    setError(null);
    setRedirecting(true);
    try {
      const { checkout_url } = await api.post<{ checkout_url: string }>(
        "/billing/create-checkout-session"
      );
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start checkout.");
      setRedirecting(false);
    }
  };

  const starterHref = !loading && user ? "/dashboard" : "/signup";
  const starterLabel = !loading && user ? "Go to dashboard" : "Get Started Free";
  const proLabel = !loading && user?.plan === "pro" ? "Manage billing" : redirecting ? "Redirecting..." : "Go Pro";

  return (
    <section id="pricing" className="bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-600 dark:text-gray-400">
          Start free. Upgrade the moment you want interview-ready prep for your gaps.
        </p>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Starter tier */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Starter</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enough to find out where you stand before every application.
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-50">$0</span>
              <span className="text-gray-500 dark:text-gray-500">/month</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {starterFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-600">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={starterHref}
              className="mt-8 block rounded-md border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {starterLabel}
            </Link>
          </div>

          {/* Pro tier */}
          <div className="relative rounded-2xl border-2 border-brand-600 bg-brand-50 p-8 shadow-lg dark:border-brand-500 dark:bg-brand-950/60">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
              Most Popular
            </span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Pro</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              For active job seekers who want to walk into interviews prepared.
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-50">$9</span>
              <span className="text-gray-500 dark:text-gray-500">/month</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-600">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleProClick}
              disabled={redirecting}
              className="mt-8 block w-full rounded-md bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {proLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
