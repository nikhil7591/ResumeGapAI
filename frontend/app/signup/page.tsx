"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import api from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_CHARS = 8;
const MAX_PASSWORD_CHARS = 72;

function SignupForm() {
  const { user, loading, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsPro = searchParams.get("plan") === "pro";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If someone is already logged in and lands here (e.g. a stale bookmark or the pricing
  // table's "Go Pro" link), don't make them sign up again — send them straight to what
  // they were actually trying to do.
  useEffect(() => {
    if (loading || !user) return;

    if (wantsPro && user.plan !== "pro") {
      setSubmitting(true);
      api
        .post<{ checkout_url: string }>("/billing/create-checkout-session")
        .then(({ checkout_url }) => {
          window.location.href = checkout_url;
        })
        .catch(() => router.replace("/billing"));
      return;
    }

    router.replace(wantsPro ? "/billing" : "/dashboard");
  }, [loading, user, wantsPro, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD_CHARS) {
      setError(`Password must be at least ${MIN_PASSWORD_CHARS} characters.`);
      return;
    }
    if (password.length > MAX_PASSWORD_CHARS) {
      setError(`Password must be under ${MAX_PASSWORD_CHARS} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      await signup(trimmedEmail, password);

      if (wantsPro) {
        const { checkout_url } = await api.post<{ checkout_url: string }>(
          "/billing/create-checkout-session"
        );
        window.location.href = checkout_url;
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Create your account</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {wantsPro
            ? "You'll be taken to Stripe checkout right after signup to activate Pro."
            : "Start free — 3 resume reviews per day, no card required."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              required
              minLength={MIN_PASSWORD_CHARS}
              maxLength={MAX_PASSWORD_CHARS}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              {MIN_PASSWORD_CHARS}-{MAX_PASSWORD_CHARS} characters.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting
              ? "Creating account..."
              : wantsPro
              ? "Sign up & continue to payment"
              : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
