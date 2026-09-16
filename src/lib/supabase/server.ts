import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseEnv } from "./env";

/** Cookie-aware client for server components and route handlers under /admin. */
export async function serverClient() {
  const env = publicSupabaseEnv();
  if (!env) return null;
  const store = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (all) => {
        try {
          all.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component: the proxy or route handler refreshes the session instead */
        }
      },
    },
  });
}
