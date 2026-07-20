"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProductPreview from "@/components/ProductPreview";

const avatarInitials = ["JD", "AK", "MS", "PR"];

export default function Hero() {
  const { user, loading } = useAuth();

  const primaryHref = !loading && user ? "/dashboard" : "/signup";
  const primaryLabel = !loading && user ? "Go to dashboard" : "Upload Your Resume Now";

  return (
    <section className="overflow-hidden bg-gradient-to-b from-brand-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto grid max-w-[88rem] grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        {/* Left: copy */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            ✦ AI-Powered Resume Review
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
            Find Resume Gaps.{" "}
            <span className="text-brand-600">Get Hired Faster.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg text-gray-600 dark:text-gray-400">
            ResumeGapAI compares your resume against any job description and shows you exactly
            what&apos;s missing — then turns those gaps into the interview questions you&apos;ll
            actually be asked, with answer outlines built from your own experience.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={primaryHref}
              className="rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-brand-700"
            >
              {primaryLabel}
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-900"
            >
              See How It Works
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {avatarInitials.map((initials) => (
                <span
                  key={initials}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-xs font-semibold text-brand-700 dark:border-gray-950 dark:bg-brand-900/50 dark:text-brand-300"
                >
                  {initials}
                </span>
              ))}
            </div>
            <div>
              <div className="flex text-amber-400" aria-hidden>
                {"★★★★★"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Free plan includes 3 reviews/day — no card required.
              </p>
            </div>
          </div>
        </div>

        {/* Right: decorative product preview */}
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-brand-100/60 blur-2xl dark:bg-brand-900/20" />
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
