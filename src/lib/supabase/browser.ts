"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseEnv } from "./env";

export function browserClient() {
  const env = publicSupabaseEnv();
  return env ? createBrowserClient(env.url, env.anonKey) : null;
}
