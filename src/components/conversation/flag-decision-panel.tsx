"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

export function FlagDecisionPanel({ flagId }: { flagId: string }) {
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState<{
    status: "confirmed" | "dismissed";
    reviewedAt: string;
  } | null>(null);

  function decide(status: "confirmed" | "dismissed") {
    setDecision({ status, reviewedAt: new Date().toISOString() });
  }

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Reviewer reason
        </span>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Document why the flag is confirmed or dismissed"
          className="h-11 rounded-2xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-teal-500"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => decide("confirmed")}>
          Confirm flag
        </Button>
        <Button variant="ghost" onClick={() => decide("dismissed")}>
          Dismiss flag
        </Button>
        {decision ? (
          <Badge
            value={`${flagId}: ${decision.status} ${formatDateTime(decision.reviewedAt)}`}
            tone={decision.status === "confirmed" ? "warning" : "neutral"}
            className="normal-case"
          />
        ) : null}
      </div>
    </div>
  );
}
