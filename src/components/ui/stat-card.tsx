import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </div>
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-3 font-serif text-4xl text-ink-950">{value}</p>
      <p className="mt-2 max-w-xs text-sm leading-6 text-stone-600">{detail}</p>
    </Card>
  );
}
