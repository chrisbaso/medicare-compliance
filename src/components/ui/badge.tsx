import { titleize } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Badge({
  value,
  tone = "neutral",
  className
}: {
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide",
        tone === "neutral" && "bg-stone-100 text-stone-700",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "danger" && "bg-rose-50 text-rose-700",
        tone === "info" && "bg-sky-50 text-sky-700",
        className
      )}
    >
      {titleize(value)}
    </span>
  );
}
