import "server-only";
import type { Locale } from "@/i18n/routing";
import { publicClient } from "@/lib/supabase/public";
import { newsletterEnv } from "./env";

/**
 * The public path to the subscriber list: three database functions gated by
 * the shared secret. This is the only module that reads the secret, and it
 * never leaves the server (server-only).
 */
export type SubscribeOutcome =
  | { outcome: "rate_limited" | "throttled" }
  | { outcome: "already"; subscriberId: string; unsubscribeToken: string }
  | { outcome: "confirm"; subscriberId: string; confirmToken: string; unsubscribeToken: string };

type Row = { outcome: string; subscriber_id: string | null; confirm_token: string | null; unsub_token: string | null };
type PersonRow = { outcome: string; sub_email: string | null; sub_locale: string | null };

function client() {
  const env = newsletterEnv();
  const sb = publicClient();
  if (!env || !sb) return null;
  return { env, sb };
}

export async function rpcSubscribe(email: string, locale: Locale, ip: string): Promise<SubscribeOutcome | null> {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.sb.rpc("newsletter_subscribe", { p_secret: c.env.secret, p_email: email, p_locale: locale, p_ip: ip });
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as Row | undefined;
  if (!row) throw new Error("newsletter_subscribe returned nothing");
  if (row.outcome === "already" && row.subscriber_id && row.unsub_token) return { outcome: "already", subscriberId: row.subscriber_id, unsubscribeToken: row.unsub_token };
  if (row.outcome === "confirm" && row.subscriber_id && row.confirm_token && row.unsub_token)
    return { outcome: "confirm", subscriberId: row.subscriber_id, confirmToken: row.confirm_token, unsubscribeToken: row.unsub_token };
  if (row.outcome === "rate_limited" || row.outcome === "throttled") return { outcome: row.outcome };
  throw new Error(`newsletter_subscribe: unexpected outcome ${row.outcome}`);
}

async function person(fn: "newsletter_confirm" | "newsletter_unsubscribe", token: string) {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.sb.rpc(fn, { p_secret: c.env.secret, p_token: token });
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as PersonRow | undefined;
  if (!row) throw new Error(`${fn} returned nothing`);
  return { outcome: row.outcome, email: row.sub_email, locale: (row.sub_locale === "hi" ? "hi" : "en") as Locale };
}

export const rpcConfirm = (token: string) => person("newsletter_confirm", token);
export const rpcUnsubscribe = (token: string) => person("newsletter_unsubscribe", token);
