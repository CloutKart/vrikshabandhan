const MAX = 80;

/** URL slug from a title; the fallback (usually the date) is used when no latin letters survive. */
export function slugify(title: string, fallback: string): string {
  const s = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX)
    .replace(/-+$/g, "");
  return s || fallback;
}
