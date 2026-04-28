import { Badge } from "@/components/ui/badge";

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "closed" || value === "complete" || value === "completed" || value === "done" || value === "granted"
      ? "success"
      : value === "blocked" || value === "pending" || value === "in_review" || value === "awaiting_consent"
        ? "warning"
        : value === "new" || value === "routed" || value === "assigned" || value === "in_progress"
          ? "info"
          : "neutral";

  return <Badge value={value} tone={tone} />;
}
