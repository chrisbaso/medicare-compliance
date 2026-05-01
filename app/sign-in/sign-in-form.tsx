"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/core/supabase/browser";

export function SignInForm({
  initialStatus,
  nextPath
}: {
  initialStatus?: string;
  nextPath: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("dana@northstar.example");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Signing in with Supabase Auth...");

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Supabase Auth sign-in failed. Check environment variables."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-6 shadow-panel">
      <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Northstar Senior Benefits</p>
      <h1 className="mt-2 font-serif text-4xl">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Supabase Auth controls access to the operations workspace.
      </p>

      <label className="mt-6 grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-2xl border border-stone-200 bg-[#fcfaf5] px-3 text-sm outline-none focus:border-teal-500"
        />
      </label>

      <label className="mt-4 grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-2xl border border-stone-200 bg-[#fcfaf5] px-3 text-sm outline-none focus:border-teal-500"
        />
      </label>

      {status ? (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-[#fcfaf5] p-4 text-sm leading-6 text-stone-700">
          {status}
        </div>
      ) : null}

      <div className="mt-6">
        <button className="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-600">
          Sign in
        </button>
      </div>
    </form>
  );
}
