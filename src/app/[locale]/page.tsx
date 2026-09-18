import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero/Hero";
import { FeaturedStory } from "@/components/home/FeaturedStory";
import { FounderTeaser } from "@/components/home/FounderTeaser";
import { InvolveTeaser } from "@/components/home/InvolveTeaser";
import { LineageStrip } from "@/components/home/LineageStrip";
import { PromiseSection } from "@/components/home/PromiseSection";
import { LatestStories } from "@/components/stories/LatestStories";
import type { Locale } from "@/i18n/routing";
import { getPosts } from "@/lib/content/posts";
import { pageMeta } from "@/lib/seo";
import "@/components/hero/hero.css";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMeta({ locale: locale as Locale, title: { absolute: t("title") }, description: t("description") });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const latest = await getPosts({ limit: 3 });
  return (
    <main id="content" className="pb-12">
      <Hero locale={l} aside={<LatestStories locale={l} posts={latest} variant="compact" />} />
      <FeaturedStory locale={l} post={latest[0] ?? null} />
      <PromiseSection locale={l} />
      <LineageStrip locale={l} />
      <LatestStories locale={l} posts={latest} />
      <FounderTeaser locale={l} />
      <InvolveTeaser locale={l} />
    </main>
  );
}
