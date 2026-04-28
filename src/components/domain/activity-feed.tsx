import { formatDateTime } from "@/lib/format";
import { AuditEvent } from "@/lib/types";

export function ActivityFeed({ items }: { items: AuditEvent[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm text-ink-950">{item.action.replaceAll("_", " ")}</strong>
            <span className="text-xs text-stone-500">{formatDateTime(item.eventAt)}</span>
          </div>
          <p className="mt-2 text-sm text-stone-600">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
