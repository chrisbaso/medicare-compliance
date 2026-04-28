"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export function RootFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/sign-in") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
