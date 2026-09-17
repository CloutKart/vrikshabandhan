import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";

/** The magic link lands here; the code becomes a session cookie, then on to the editor. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const login = (reason: string) => NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(reason)}`, url.origin));
  // Supabase reports an expired or already used link on the query string.
  const reported = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (reported) return login(reported);
  const code = url.searchParams.get("code");
  const sb = await serverClient();
  if (!code || !sb) return login("The link did not carry a sign-in code.");
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) return login(error.message);
  return NextResponse.redirect(new URL("/admin", url.origin));
}
