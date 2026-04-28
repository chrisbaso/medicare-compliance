import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-panel border border-black/5 bg-white/80 p-5 shadow-panel", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p> : null}
        <h2 className="mt-1 font-serif text-2xl text-ink-950">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm text-stone-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
