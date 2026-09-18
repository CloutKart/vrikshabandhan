import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content/posts";
import { sitemapEntries } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(siteUrl(), await getPosts());
}
