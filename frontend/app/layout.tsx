import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, themeInitScript } from "@/lib/theme-context";
import { ReviewHistoryProvider } from "@/lib/review-history-context";
import { HistoryDrawerProvider } from "@/lib/history-drawer-context";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import HistoryDrawer from "@/components/HistoryDrawer";

export const metadata: Metadata = {
  title: "ResumeGapAI — AI Resume Reviewer",
  description: "Know your resume's gaps — and exactly what you'll be asked about them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script: sets the `dark` class before first paint to avoid a flash of
            the wrong theme. Reads localStorage, falls back to the OS color-scheme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100"
      >
        <ThemeProvider>
          <AuthProvider>
            <ReviewHistoryProvider>
              <HistoryDrawerProvider>
                <Navbar />
                <div className="flex-1">{children}</div>
                <ConditionalFooter />
                <HistoryDrawer />
              </HistoryDrawerProvider>
            </ReviewHistoryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
