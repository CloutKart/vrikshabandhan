/**
 * The site's own address, for anything that must be absolute: canonical links,
 * share cards, the sitemap, the links inside e-mails. Never taken from the
 * request's Host header, which a caller controls.
 */
export function siteUrl(): string {
  const fromEnv = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/** An absolute URL for a path or an already absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${siteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
