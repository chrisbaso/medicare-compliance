import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <h3 className="font-serif text-xl text-ink-950">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
    </Card>
  );
}
