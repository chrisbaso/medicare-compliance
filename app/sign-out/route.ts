import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/core/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Supabase public environment is not configured")) {
      throw error;
    }
  }

  redirect("/sign-in");
}
