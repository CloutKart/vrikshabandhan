import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { publicSupabaseEnv } from "./lib/supabase/env";

const intl = createMiddleware(routing);

/**
 * Two jobs. Under /admin, keep the editor's Supabase session fresh: the
 * server client refreshes an expiring token here, where cookies can be
 * written (server components cannot). Everywhere else, next-intl routing.
 */
export default async function proxy(request: NextRequest) {
  if (!/^\/admin(?:\/|$)/.test(request.nextUrl.pathname)) return intl(request);
  const env = publicSupabaseEnv();
  let response = NextResponse.next({ request });
  if (!env) return response;
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (all) => {
        all.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        all.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Not awaited for its result: the call is what refreshes the cookies.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Everything except Next internals, static assets and files with an extension. /admin is handled above.
  matcher: ["/((?!api|_next|_vercel|images|.*\\..*).*)"],
};
