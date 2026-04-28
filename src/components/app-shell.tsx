"use client";

import { Sidebar, SidebarNavItem } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { getCurrentUser } from "@/lib/demo-selectors";

const navItems: SidebarNavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/conversations", label: "Conversations" },
  { href: "/consents", label: "Consents" },
  { href: "/opportunities", label: "Retirement follow-up" },
  { href: "/compliance", label: "Compliance" },
  { href: "/tasks", label: "Tasks" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useDemoApp();
  const currentUser = getCurrentUser(state);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(29,140,130,0.10),transparent_28%),linear-gradient(180deg,#faf7f1_0%,#f5f0e7_100%)] lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
      <Sidebar
        agencyName={state.agency.name}
        navItems={navItems}
        asideContent={
          <>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Workspace status</p>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Demo-first admin shell for Medicare intake operations, conversation review, consent tracking, compliance oversight, and separate retirement-income follow-up routing.
            </p>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-[#fcfaf5] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Signed in as</p>
              <p className="mt-1 text-sm font-medium text-ink-950">{currentUser.fullName}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{currentUser.role}</p>
            </div>
          </>
        }
        footer={
          <div className="rounded-panel border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 shadow-panel">
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700">Guardrail</p>
            <p className="mt-2 leading-6">
              Medicare workflows stay separate from retirement-income follow-up. Signals route to a consented, auditable human workflow.
            </p>
          </div>
        }
      />

      <div className="min-w-0 p-4 lg:p-5">
        <TopBar
          agencyName={state.agency.name}
          userName={currentUser.fullName}
          userRole={currentUser.role}
        />
        <main className="mt-4 space-y-4">{children}</main>
      </div>
    </div>
  );
}
