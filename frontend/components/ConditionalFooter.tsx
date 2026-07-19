"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const HIDDEN_PREFIXES = ["/dashboard", "/billing"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hide = HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  if (hide) return null;
  return <Footer />;
}
