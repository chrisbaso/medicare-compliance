type EnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "ANTHROPIC_API_KEY"
  | "OPENAI_API_KEY"
  | "APP_ENV";

export interface AppEnv {
  appEnv: "development" | "test" | "production" | "demo";
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
}

const allowedAppEnvs = new Set<AppEnv["appEnv"]>([
  "development",
  "test",
  "production",
  "demo"
]);

function readEnv(key: EnvKey) {
  return process.env[key]?.trim() || undefined;
}

export function getAppEnv(): AppEnv {
  const appEnv = readEnv("APP_ENV") ?? "demo";

  if (!allowedAppEnvs.has(appEnv as AppEnv["appEnv"])) {
    throw new Error(`Invalid APP_ENV '${appEnv}'. Expected development, test, production, or demo.`);
  }

  return {
    appEnv: appEnv as AppEnv["appEnv"],
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    anthropicApiKey: readEnv("ANTHROPIC_API_KEY"),
    openaiApiKey: readEnv("OPENAI_API_KEY")
  };
}

export function assertSupabaseConfigured(env: AppEnv = getAppEnv()) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
    serviceRoleKey: env.supabaseServiceRoleKey
  };
}

export function assertAnthropicConfigured(env: AppEnv = getAppEnv()) {
  if (!env.anthropicApiKey) {
    throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY.");
  }

  return {
    apiKey: env.anthropicApiKey
  };
}
