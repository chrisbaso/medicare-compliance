import { assertSupabaseConfigured, getAppEnv } from "@/lib/core/env";

export interface SupabaseRestRequest {
  table: string;
  method?: "GET" | "POST" | "PATCH";
  query?: string;
  body?: unknown;
  accessToken?: string;
  prefer?: string;
}

export async function supabaseRestRequest<T>(request: SupabaseRestRequest): Promise<T> {
  const { url, anonKey } = assertSupabaseConfigured(getAppEnv());
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${request.table}${request.query ?? ""}`;
  const response = await fetch(endpoint, {
    method: request.method ?? "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${request.accessToken ?? anonKey}`,
      "Content-Type": "application/json",
      Prefer: request.prefer ?? "return=representation"
    },
    body: request.body ? JSON.stringify(request.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase REST request failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function supabaseAuthPasswordSignIn({
  email,
  password
}: {
  email: string;
  password: string;
}) {
  const { url, anonKey } = assertSupabaseConfigured(getAppEnv());
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase auth sign-in failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: { id: string; email?: string };
  }>;
}
