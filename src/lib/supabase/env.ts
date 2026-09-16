/** Public Supabase settings, or null when the site runs without a database (tests, previews). */
export function publicSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export const MEDIA_BUCKET = "media";

export function storagePublicUrl(path: string): string | null {
  const env = publicSupabaseEnv();
  return env ? `${env.url}/storage/v1/object/public/${MEDIA_BUCKET}/${path}` : null;
}
