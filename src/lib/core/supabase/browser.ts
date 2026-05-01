"use client";

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { Database } from "../../../../supabase/types";
import { requireSupabasePublicEnv } from "@/lib/core/env/client";

export function createBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = requireSupabasePublicEnv();
  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
