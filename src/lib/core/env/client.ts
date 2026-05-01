import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const publicEnv = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional()
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  emptyStringAsUndefined: true
});

export const clientEnv = {
  supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

export function requireSupabasePublicEnv() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase public environment is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}
