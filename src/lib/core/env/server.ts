import "server-only";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { requireSupabasePublicEnv } from "@/lib/core/env/client";

const privateEnv = createEnv({
  server: {
    APP_ENV: z.enum(["development", "test", "production", "demo"]).default("demo"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional()
  },
  runtimeEnv: {
    APP_ENV: process.env.APP_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  emptyStringAsUndefined: true
});

export const serverEnv = {
  appEnv: privateEnv.APP_ENV,
  supabaseServiceRoleKey: privateEnv.SUPABASE_SERVICE_ROLE_KEY,
  anthropicApiKey: privateEnv.ANTHROPIC_API_KEY,
  openAiApiKey: privateEnv.OPENAI_API_KEY
};

export function requireSupabaseServiceEnv() {
  const publicEnv = requireSupabasePublicEnv();

  if (!privateEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    ...publicEnv,
    supabaseServiceRoleKey: privateEnv.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function requireAnthropicEnv() {
  if (!privateEnv.ANTHROPIC_API_KEY) {
    throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY.");
  }

  return {
    anthropicApiKey: privateEnv.ANTHROPIC_API_KEY
  };
}
