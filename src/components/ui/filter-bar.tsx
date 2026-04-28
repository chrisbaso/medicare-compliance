import { cn } from "@/lib/utils";

export function FilterBar({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-stone-200 bg-[#fcfaf5] p-4", className)}>
      <div className="grid gap-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}

export function FilterField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</span>
      {children}
    </label>
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-11 rounded-2xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-teal-500", className)}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("h-11 rounded-2xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-teal-500", className)}
      {...props}
    />
  );
}
