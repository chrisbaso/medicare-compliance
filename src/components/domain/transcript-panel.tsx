import { formatDateTime } from "@/lib/format";
import { TranscriptEntry } from "@/lib/types";

export function TranscriptPanel({ entries }: { entries: TranscriptEntry[] }) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article key={entry.id} className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm text-ink-950">{entry.speakerName}</strong>
            <span className="text-xs text-stone-500">{formatDateTime(entry.spokenAt)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-700">{entry.utterance}</p>
        </article>
      ))}
    </div>
  );
}
