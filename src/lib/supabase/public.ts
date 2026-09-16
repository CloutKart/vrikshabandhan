import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "./env";

let client: SupabaseClient | null | undefined;

/** Anonymous, cookie-free client for public reads. Null when Supabase is not configured. */
export function publicClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const env = publicSupabaseEnv();
  client = env ? createClient(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}
