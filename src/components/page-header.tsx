export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Compliance-first operations</p>
        <h1 className="mt-2 font-serif text-4xl text-ink-950 lg:text-5xl">{title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
