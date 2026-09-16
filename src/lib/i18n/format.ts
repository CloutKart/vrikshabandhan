import type { Locale } from "@/i18n/routing";

const TAGS: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

/** "2023-12-11" -> "11 December 2023" / "11 दिसंबर 2023". Falls back to the input when unparsable. */
export function formatStoryDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(TAGS[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
