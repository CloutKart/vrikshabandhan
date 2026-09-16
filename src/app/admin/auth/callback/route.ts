import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";

/** The magic link lands here; the code becomes a session cookie, then on to the editor. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const sb = await serverClient();
  if (code && sb) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
