/** The popup waits this long on a story page before it may ask. */
export const ASK_DWELL_MS = 12_000;
/** Recipients per request to the mail provider's batch endpoint. */
export const BATCH_SIZE = 100;
/** A confirmation link works this long. Mirrors the interval in supabase/migrations/0004_newsletter.sql. */
export const CONFIRM_TTL_HOURS = 48;
/** Pause between batch requests, under the provider's rate limit of two requests a second. */
export const BATCH_PAUSE_MS = 600;
