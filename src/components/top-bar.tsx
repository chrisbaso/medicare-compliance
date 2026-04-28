"use client";

import { cn } from "@/lib/utils";

export function TopBar({
  agencyName,
  userName,
  userRole,
  className
}: {
  agencyName: string;
  userName: string;
  userRole: string;
  className?: string;
}) {
  return (
    <header className={cn("rounded-panel border border-black/5 bg-white/80 px-5 py-4 shadow-panel", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Operations workspace</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl text-ink-950">{agencyName}</h1>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              Compliance mode
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex h-11 min-w-[260px] items-center gap-3 rounded-2xl border border-stone-200 bg-[#fcfaf5] px-4 text-sm text-stone-500">
            <span className="text-base text-stone-400">/</span>
            <span>Search clients, conversations, or tasks</span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#fcfaf5] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700">
              {userName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium text-ink-950">{userName}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
