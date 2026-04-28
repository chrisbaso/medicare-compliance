import Link from "next/link";
import { cn } from "@/lib/utils";

const buttonStyles =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={cn(
        buttonStyles,
        variant === "primary" && "bg-teal-700 text-white hover:bg-teal-600",
        variant === "secondary" && "bg-stone-100 text-stone-900 hover:bg-stone-200",
        variant === "ghost" && "bg-transparent text-stone-700 hover:bg-stone-100",
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  className,
  variant = "primary",
  children
}: {
  href: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonStyles,
        variant === "primary" && "bg-teal-700 text-white hover:bg-teal-600",
        variant === "secondary" && "bg-stone-100 text-stone-900 hover:bg-stone-200",
        variant === "ghost" && "bg-transparent text-stone-700 hover:bg-stone-100",
        className
      )}
    >
      {children}
    </Link>
  );
}
