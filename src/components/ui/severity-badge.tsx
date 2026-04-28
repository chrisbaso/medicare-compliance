import { Badge } from "@/components/ui/badge";

export function SeverityBadge({ value }: { value: string }) {
  const tone =
    value === "critical" || value === "high"
      ? "danger"
      : value === "medium" || value === "warning"
        ? "warning"
        : "neutral";

  return <Badge value={value} tone={tone} />;
}
