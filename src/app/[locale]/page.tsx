import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero/Hero";
import { LatestStories } from "@/components/stories/LatestStories";
import type { Locale } from "@/i18n/routing";
import { getPosts } from "@/lib/content/posts";
import "@/components/hero/hero.css";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const latest = await getPosts({ limit: 3 });
  return (
    <main id="content" className="pb-24">
      <Hero locale={l} aside={<LatestStories locale={l} posts={latest} variant="compact" />} />
      <LatestStories locale={l} posts={latest} />
    </main>
  );
}
