import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/core/auth/session";
import { SignInForm } from "./sign-in-form";

interface SignInPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  const nextPath = firstParam(params?.next) ?? "/dashboard";
  const initialStatus =
    firstParam(params?.auth) === "not_configured"
      ? "Supabase environment variables are not configured for this runtime."
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f2e8] px-5 py-10 text-ink-950">
      <SignInForm initialStatus={initialStatus} nextPath={nextPath} />
    </main>
  );
}
