import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f2e8] text-ink-950">
      <section className="grid min-h-screen gap-8 px-5 py-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-10">
        <div className="flex flex-col justify-between">
          <nav className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Northstar-ready MVP</p>
              <h1 className="mt-2 font-serif text-3xl">Compliance Ops for Medicare Agencies</h1>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-600"
            >
              Open demo
            </Link>
          </nav>

          <div className="py-14 lg:py-20">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-teal-700">
              Compliance-first operations platform
            </p>
            <h2 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.02] lg:text-7xl">
              Review every Medicare conversation with consent, audit, and handoff discipline.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-700">
              A working internal command center for agency owners: conversation QA, scope-of-appointment tracking,
              consent ledger, separate retirement-income workflow, and reviewer-ready AI flags. No plan recommendations.
              No annuity recommendations. Humans stay in control.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/conversations/conv-020"
                className="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-600"
              >
                Review flagged call
              </Link>
              <Link
                href="/consents"
                className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
              >
                Open consent ledger
              </Link>
            </div>
          </div>

          <div className="grid gap-3 border-t border-stone-300 pt-5 text-sm text-stone-600 sm:grid-cols-3">
            <p>Medicare and retirement-income work remain operationally separate.</p>
            <p>AI reviews, flags, summarizes, and routes. It never selects products.</p>
            <p>Every meaningful action is designed for audit reconstruction.</p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-panel">
            <div className="border-b border-stone-200 bg-[#fcfaf5] px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Live demo story</p>
              <h3 className="mt-2 font-serif text-3xl">Harold Bennett review</h3>
            </div>
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border-b border-stone-200 p-5 lg:border-b-0 lg:border-r">
                <div className="space-y-3">
                  {[
                    ["Conversation", "Premium pressure surfaced during Medicare review"],
                    ["AI flag", "Retirement-income mention without separate consent"],
                    ["Consent", "Separate follow-up blocked"],
                    ["Next action", "Compliance reviewer confirms flag"]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
                      <p className="mt-2 text-sm font-medium leading-6">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-rose-700">Flagged transcript quote</p>
                  <p className="mt-3 text-lg leading-8 text-rose-950">
                    “My Medicare supplement premium jumped again and I am worried about my retirement income lasting.”
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-sky-700">Required separation</p>
                  <p className="mt-3 text-sm leading-6 text-stone-700">
                    The Medicare review stays in compliance QA. Any retirement-income follow-up moves only by explicit
                    human action after separate consent is recorded.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Open flags" value="1" />
                  <Metric label="Audit events" value="12" />
                  <Metric label="Auto-outbound" value="0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
      <p className="font-serif text-3xl">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
    </div>
  );
}
