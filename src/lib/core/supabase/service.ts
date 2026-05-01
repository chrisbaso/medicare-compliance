import "server-only";

import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../../supabase/types";
import { requireSupabaseServiceEnv } from "@/lib/core/env/server";

export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient cannot be used in the browser.");
  }

  const { supabaseUrl, supabaseServiceRoleKey } = requireSupabaseServiceEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
