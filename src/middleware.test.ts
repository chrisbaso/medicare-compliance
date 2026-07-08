import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

// With Supabase public env unset and demo bypass off, the middleware cannot
// establish a session. This proves API routes are gated at the edge: they
// return 401 (not a redirect, not a pass-through) BEFORE any route handler runs.
describe("middleware API authentication gate", () => {
  beforeEach(() => {
    delete process.env.DEMO_BYPASS_AUTH;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("returns 401 JSON for an unauthenticated API request", async () => {
    const req = new NextRequest("http://localhost/api/conversations/abc/review", { method: "POST" });
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Authentication required/i);
  });

  it("redirects an unauthenticated page request to sign-in (not 401)", async () => {
    const req = new NextRequest("http://localhost/dashboard", { method: "GET" });
    const res = await middleware(req);
    expect(res.status).toBe(307); // Next redirect
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("passes through when local demo bypass is enabled", async () => {
    process.env.DEMO_BYPASS_AUTH = "true";
    const req = new NextRequest("http://localhost/api/conversations/abc/review", { method: "POST" });
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });
});
