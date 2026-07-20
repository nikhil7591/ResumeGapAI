"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
      <circle cx="12" cy="8" r="3.25" />
    </svg>
  );
}

function getInitials(email?: string | null) {
  if (!email) return "U";
  const [localPart] = email.split("@");
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return localPart.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleHistory } = useHistoryDrawer();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const showHistoryButton = Boolean(user) && pathname.startsWith("/dashboard");

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/");
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex w-full max-w-[88rem] items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm text-white">
            R
          </span>
          <span className="text-gray-900 dark:text-gray-50">
            ResumeGap<span className="text-brand-600">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 sm:gap-4 lg:gap-5">
          {!loading && !user && (
            <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300 lg:flex">
              {marketingLinks.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-brand-600">
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
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
                  onClick={toggleTheme}
                  aria-label="Toggle color theme"
                  className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                </button>

                {showHistoryButton && (
                  <button
                    onClick={toggleHistory}
                    aria-label="Toggle review history"
                    className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 sm:px-3"
                  >
                    🕒<span className="hidden sm:inline">History</span>
                  </button>
                )}

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label="Open account menu"
                    aria-expanded={menuOpen}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {getInitials(user.email)}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-900"
                      >
                        <UserIcon />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-900"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 00.34 1.87l.05.05a2 2 0 01-1.42 3.42h-.05a1.7 1.7 0 00-1.54 1.07 2 2 0 01-1.85 1.23h-1a1.7 1.7 0 00-1.6.94l-.03.05a2 2 0 01-3.46 0l-.03-.05a1.7 1.7 0 00-1.6-.94h-1a2 2 0 01-1.85-1.23 1.7 1.7 0 00-1.54-1.07H4.2a2 2 0 01-1.42-3.42l.05-.05A1.7 1.7 0 003.18 15a2 2 0 01-.18-1.9v-.1a1.7 1.7 0 00-.33-1.87l-.05-.05a2 2 0 011.42-3.42h.05a1.7 1.7 0 001.54-1.07A2 2 0 016.48 5.36h1a1.7 1.7 0 001.6-.94l.03-.05a2 2 0 013.46 0l.03.05a1.7 1.7 0 001.6.94h1a2 2 0 011.85 1.23 1.7 1.7 0 001.54 1.07h.05a2 2 0 011.42 3.42l-.05.05a1.7 1.7 0 00-.34 1.87v.1a2 2 0 01.18 1.9z" />
                        </svg>
                        Settings
                      </Link>
                    </div>
                  )}
                </div>

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

          </div>
        </div>
      </nav>
    </header>
  );
}
