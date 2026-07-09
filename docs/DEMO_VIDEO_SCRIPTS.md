# Demo Video Scripts

Two ready-to-record scripts: a ~3-minute **sales video** (send-ahead or landing page)
and an ~8-minute **training video** (for an agency that said yes). Record with Loom or
QuickTime against the running app (`npm run dev`, demo mode, or a live pilot org
seeded with `test-fixtures/demo-book.csv`).

Recording tips for a solo founder:
- Your voice over the real product beats a produced video for warm intros. Don't
  over-polish; one take with a stumble is fine.
- Set the browser to a clean profile, 1280×800 window, hide bookmarks bar.
- Do a 60-second dry run of the click path first so the cursor never hunts.
- Speak to ONE person ("you"), never "users" or "agencies."

---

## Video 1 — Sales (~3 minutes)

**Audience:** agency owner, warm relationship. **Goal:** get them to say "show me on my book."

| # | Screen / action | Say (roughly) |
|---|---|---|
| 1 | Face to camera or dashboard idle (0:00–0:20) | "You know how much of your income is renewals — and how little visibility you actually have into the book behind them. I want to show you something I've been building that fixes that, in about three minutes." |
| 2 | **/onboarding** — pick `demo-book.csv`, click *Validate (dry run)* (0:20–0:50) | "This is a normal CRM export — the same file you'd pull from your system today. Before anything imports, every row gets checked. Bad birth dates, unknown states, duplicates — you see the report first, and it's all-or-nothing. No half-loaded book." |
| 3 | Click *Commit import* (0:50–1:00) | "One click, and your whole book is in." |
| 4 | **/book** — scroll the ranked queue slowly (1:00–1:50) | "And this is the part that matters: it reads the book and tells you who to call and why. She's turning 65 in two months — enrollment window. He mentioned a premium increase and nobody's talked to him in four months — that's a renewal walking out the door. Each one has a plain-English reason and the next step. Notice what it never says: it never recommends a plan. It tells you who needs a *conversation*." |
| 5 | **/conversations/[id]** — run AI review, flags appear (1:50–2:20) | "It also reviews conversations against CMS rules — cross-sell language, missing scope-of-appointment, guarantee claims. It flags; a human decides. Every decision gets a documented reason." |
| 6 | **/audit-pack** — click *Year to date*, scroll gaps (2:20–2:50) | "And when a carrier asks — this. One click: consent coverage, every flag and how it was resolved, and the gaps to close *before* an examiner finds them. Print it, hand it over." |
| 7 | Face to camera (2:50–3:10) | "Fifteen minutes with your own CRM export and you'll see your own book like this. No commitment — I want a couple of agencies I trust to beat on it. Call me." |

**Cut lines if over 3:00:** scene 5 can drop to one sentence ("It also reviews call transcripts against CMS rules and flags problems for you to confirm or dismiss").

---

## Video 2 — Training (~8 minutes)

**Audience:** the agency's staff after the owner said yes. **Goal:** they can use it
tomorrow without you. Structure = one segment per daily job.

### Segment 1 — Sign in and the dashboard (0:00–1:00)
- Show sign-in, land on dashboard.
- "Three numbers matter every morning: open flags, pending consents, open tasks.
  Everything on this screen is a link to the work behind it."

### Segment 2 — Importing a book (1:00–2:30)
- **/onboarding**: choose file → auto-detect → *Validate (dry run)*.
- Show a file WITH errors first (`demo-book-with-errors.csv`): point at the
  row-numbered error report. "Row 4 has a bad birth date; row 7 is a duplicate of
  row 2. Fix the file, upload again. It will never import a partial book."
- Then the clean file → *Commit*. Mention the re-import checkbox: "If you're
  re-uploading the same book, tick this and existing clients are skipped."

### Segment 3 — Working the outreach queue (2:30–4:30)
- **/book**: explain the score ("higher = call sooner"), the signal chips, and the
  *Next:* line. Filter by signal type (show Turning 65).
- Click into a client: show consents, tasks, conversations on the client page.
- Rule of thumb to teach: "Work top-down. Every call you make, the reason and the
  next step are already written for you. And the golden rule — nothing here is a
  plan recommendation. It's a reason to have a conversation."

### Segment 4 — Conversation review and flags (4:30–6:30)
- **/conversations**: the inbox and its filters (needs review, high risk).
- Open one, click *Run AI review*. Walk one flag: the quoted transcript text, the
  rule, the severity, the suggested remediation.
- Show *Confirm* / *Dismiss* with a reason: "You are the decision-maker. The AI
  never closes its own flags. Your reason goes in the permanent record."
- Show the blocking behavior: "A conversation with an open high-severity flag can't
  be closed out until someone resolves the flag. That's on purpose."

### Segment 5 — Consents and the separation rule (6:30–7:30)
- **/consents**: SOA records, evidence-complete vs not.
- The one rule to drill: "If retirement income or an annuity comes up on a Medicare
  call — stop. The system flags it and blocks follow-up until a separate consent is
  documented. This is the thing that keeps the agency safe in an audit."

### Segment 6 — The audit pack (7:30–8:00)
- **/audit-pack**: pick a range, walk the four sections, *Print / save as PDF*.
- "Before any carrier call or compliance review, print this. Close the gaps list
  first — it's the examiner's findings, found early."

---

## Live-demo kit (for in-person / screen-share with an owner)

1. `npm run dev` with demo data, or the pilot org seeded fresh.
2. Files on the desktop: `demo-book.csv` (clean) and `demo-book-with-errors.csv`.
3. Click path: onboarding (errors file → clean file) → /book → one client →
   one conversation + AI review → /audit-pack → their questions.
4. The close: "Send me your CRM export tonight — anonymize the phone numbers if you
   want — and tomorrow I'll show you this exact screen with *your* book on it."
5. Send-ahead / leave-behind: the sales page artifact link.
