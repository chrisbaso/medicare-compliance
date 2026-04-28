import { cn } from "@/lib/utils";

export function BasicTable({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-3xl border border-stone-200 bg-[#fcfaf5]", className)}>
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function BasicTableHead({ children }: { children: React.ReactNode }) {
  return <thead className="text-[11px] uppercase tracking-[0.2em] text-stone-500">{children}</thead>;
}

export function BasicTableHeaderCell({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

export function BasicTableCell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("border-t border-stone-200 px-4 py-4 align-top text-stone-700", className)}>{children}</td>;
}
