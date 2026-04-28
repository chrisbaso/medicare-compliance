import { StatCard } from "@/components/ui/stat-card";

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return <StatCard label={label} value={value} detail={detail} />;
}
