"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useHistoryDrawer } from "@/lib/history-drawer-context";

const marketingLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleHistory } = useHistoryDrawer();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm text-white">
            R
          </span>
          <span className="text-gray-900 dark:text-gray-50">
            ResumeGap<span className="text-brand-600">AI</span>
          </span>
        </Link>

        {!loading && !user && (
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300 lg:flex">
            {marketingLinks.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-brand-600">
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 sm:gap-3 lg:gap-4">
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="hidden hover:text-brand-600 sm:inline">
                Dashboard
              </Link>
              <Link href="/billing" className="hidden hover:text-brand-600 sm:inline">
                Billing
              </Link>
              <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 sm:inline">
                {user.plan}
              </span>
              <button
                onClick={handleLogout}
                aria-label="Log out"
                className="rounded-md border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:px-3"
              >
                <span className="sm:hidden">⏻</span>
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="hidden hover:text-brand-600 sm:inline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
              >
                Get Started Free
              </Link>
            </>
          ) : null}

          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {!loading && user && (
            <button
              onClick={toggleHistory}
              aria-label="Toggle review history"
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:px-3"
            >
              🕒<span className="hidden sm:inline">History</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
