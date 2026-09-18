import { routing, type Locale } from "@/i18n/routing";

const LOCAL = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
const DOMAIN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** A trimmed, lower-cased address that a mail provider will accept, or null. */
export function cleanEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || !LOCAL.test(local) || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
  if (!DOMAIN.test(domain)) return null;
  return email;
}

/** The chosen language, or the page's when the value is missing or unknown. */
export function cleanLocale(raw: unknown, fallback: Locale): Locale {
  return typeof raw === "string" && (routing.locales as readonly string[]).includes(raw) ? (raw as Locale) : fallback;
}

/** The form's fields: a valid address and language, a flag when the honeypot was filled, or null when invalid. */
export function parseSubscribeInput(form: FormData, pageLocale: Locale): { email: string; locale: Locale; trap: boolean } | null {
  const trap = typeof form.get("website") === "string" && (form.get("website") as string).length > 0;
  const email = cleanEmail(form.get("email"));
  if (!email) return null;
  return { email, locale: cleanLocale(form.get("locale"), pageLocale), trap };
}

/** Confirmation and unsubscribe tokens are exactly 64 hex characters. */
export function isToken(raw: unknown): raw is string {
  return typeof raw === "string" && /^[0-9a-f]{64}$/.test(raw);
}
