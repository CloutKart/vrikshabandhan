import { NextResponse, type NextRequest } from "next/server";
import { rpcUnsubscribe } from "@/lib/newsletter/db";
import { isToken } from "@/lib/newsletter/validate";

/**
 * RFC 8058 one-click unsubscribe, the address in every story mail's
 * List-Unsubscribe header. Mail clients POST here with the body
 * "List-Unsubscribe=One-Click"; the answer is always 200 and says nothing
 * about the token, so it can neither leak validity nor error at a client.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const body = await request.text().catch(() => "");
  if (isToken(token) && /List-Unsubscribe=One-Click/.test(body)) {
    try {
      await rpcUnsubscribe(token);
    } catch (e) {
      console.error("newsletter: one-click unsubscribe failed", e instanceof Error ? e.message : e);
    }
  }
  return new Response(null, { status: 200 });
}

/** A person following the header link by hand lands on the page with the button. */
export function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t") ?? "";
  const l = request.nextUrl.searchParams.get("l") === "hi" ? "hi" : "en";
  return NextResponse.redirect(new URL(`/${l}/newsletter/unsubscribe?t=${encodeURIComponent(t)}`, request.nextUrl), 302);
}
