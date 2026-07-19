"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function CtaBanner() {
  const { user, loading } = useAuth();
  const href = !loading && user ? "/dashboard" : "/signup";
  const label = !loading && user ? "Go to dashboard" : "Upload Your Resume Now";

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-brand-50 px-8 py-10 dark:bg-brand-900/20 sm:flex-row">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            Ready to improve your resume?
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Upload your resume now and get AI-powered insights to take the next step in your career.
          </p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-md bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700"
        >
          {label}
        </Link>
      </div>
    </section>
  );
}
