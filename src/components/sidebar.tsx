"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  href: string;
  label: string;
}

export function Sidebar({
  agencyName,
  navItems,
  footer,
  asideContent
}: {
  agencyName: string;
  navItems: SidebarNavItem[];
  footer?: React.ReactNode;
  asideContent?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-black/5 bg-white/75 px-5 py-5 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-5">
        <div className="rounded-panel border border-black/5 bg-white/90 p-5 shadow-panel">
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Medicare agency ops</p>
          <h2 className="mt-2 font-serif text-2xl text-ink-950">{agencyName}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Compliance-first workspace for conversations, consent, workflow routing, and operational review.
          </p>
        </div>

        <nav className="grid gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-teal-700 text-white shadow-panel"
                    : "text-stone-700 hover:bg-teal-50 hover:text-ink-950"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {asideContent ? <div className="rounded-panel border border-black/5 bg-white/90 p-5 shadow-panel">{asideContent}</div> : null}

        {footer ? <div className="mt-auto">{footer}</div> : null}
      </div>
    </aside>
  );
}
