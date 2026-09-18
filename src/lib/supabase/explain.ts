/** Turn a Supabase error into a sentence an editor can act on. */
export function explain(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "23505") return "another post already uses this address; change the address field.";
  if (code === "PGRST116") return "the post was not found, or your session has ended. Sign in again and retry.";
  return e instanceof Error ? e.message : "error";
}
