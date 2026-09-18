import type { Metadata, MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import type { Post } from "@/lib/content/types";

/** The default share image: the painting, 1200x630 (scripts/og-image.mjs). */
export const OG_IMAGE = { url: "/images/og.jpg", width: 1200, height: 630 };

/** The public routes that exist in both languages, as paths after the locale. */
export const STATIC_PATHS = ["", "/stories", "/founder", "/thread", "/get-involved"] as const;

export function ogLocale(locale: Locale): string {
  return locale === "hi" ? "hi_IN" : "en_IN";
}

/** Canonical and hreflang links for one page in one language; x-default is the English page. */
export function pageAlternates(locale: Locale, path = ""): NonNullable<Metadata["alternates"]> {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`]));
  return { canonical: `/${locale}${path}`, languages: { ...languages, "x-default": `/${routing.defaultLocale}${path}` } };
}

type PageMeta = {
  locale: Locale;
  /** The path after the locale, "" for the home page. */
  path?: string;
  title?: string | { absolute: string };
  description?: string;
  /** A share image path or absolute URL; the painting when absent. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
};

/** Everything a page needs to be found and shared: title, description, canonical, hreflang, Open Graph, Twitter. */
export async function pageMeta({ locale, path = "", title, description, image, type = "website", publishedTime, noIndex }: PageMeta): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const other = routing.locales.filter((l) => l !== locale);
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      siteName: t("title"),
      locale: ogLocale(locale),
      alternateLocale: other.map(ogLocale),
      url: `/${locale}${path}`,
      images: [image ? { url: image } : OG_IMAGE],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image" },
  };
}

/** Sitemap entries for the static routes and the live stories, in both languages, each naming its twin. */
export function sitemapEntries(base: string, posts: Post[]): MetadataRoute.Sitemap {
  const languagesFor = (path: string) => Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`]));
  const entry = (locale: Locale, path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}): MetadataRoute.Sitemap[number] => ({
    url: `${base}/${locale}${path}`,
    alternates: { languages: languagesFor(path) },
    ...extra,
  });
  const statics = STATIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => entry(locale, path, { changeFrequency: path === "" || path === "/stories" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.7 })),
  );
  const stories = posts.flatMap((p) =>
    routing.locales.map((locale) => entry(locale, `/stories/${p.slug}`, { lastModified: new Date(p.date), changeFrequency: "yearly", priority: 0.8 })),
  );
  return [...statics, ...stories];
}
