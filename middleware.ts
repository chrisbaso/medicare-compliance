import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireSupabasePublicEnv } from "@/lib/core/env/client";

const PUBLIC_ROUTES = new Set(["/", "/sign-in"]);
// Explicit allow-list of API routes that may be reached without a session
// (e.g. future health checks / webhooks). Empty by default: every /api route
// requires authentication unless deliberately listed here.
const PUBLIC_API_ROUTES = new Set<string>([]);
function isLocalDemoBypassEnabled() {
  return process.env.DEMO_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

function isPublicPath(pathname: string) {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_API_ROUTES.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

// Unauthenticated API requests get a 401 JSON response instead of a redirect.
function unauthorizedApiResponse() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  let response = NextResponse.next({ request });

  // NOTE: API routes are NOT exempt from authentication. They flow through the
  // same Supabase session check below. Individual handlers still perform
  // authorization (role/ownership) on top of this authentication gate.

  if (isLocalDemoBypassEnabled()) {
    return response;
  }

  let supabaseConfig: ReturnType<typeof requireSupabasePublicEnv>;
  try {
    supabaseConfig = requireSupabasePublicEnv();
  } catch (error) {
    if (!isPublicPath(pathname)) {
      if (isApi) {
        return unauthorizedApiResponse();
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/sign-in";
      redirectUrl.searchParams.set("auth", "not_configured");
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  const supabase = createServerClient(
    supabaseConfig.supabaseUrl,
    supabaseConfig.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(pathname)) {
    if (isApi) {
      return unauthorizedApiResponse();
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/sign-in") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
