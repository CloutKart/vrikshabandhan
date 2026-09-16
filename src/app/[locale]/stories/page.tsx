import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PaintingDetail } from "@/components/painting/PaintingDetail";
import { StoryList } from "@/components/stories/StoryList";
import { TagFilter } from "@/components/stories/TagFilter";
import { PageHeader } from "@/components/typography/PageHeader";
import type { Locale } from "@/i18n/routing";
import { getPosts, getTags } from "@/lib/content/posts";
import { bilingual } from "@/lib/i18n/bilingual";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ tag?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stories" });
  return { title: t("title"), description: t("lede") };
}

export default async function StoriesPage({ params, searchParams }: Props) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const tag = Array.isArray(sp.tag) ? sp.tag[0] : sp.tag;
  const [posts, tags, pair, t] = await Promise.all([
    getPosts({ tag }),
    getTags(),
    bilingual(locale, "stories", "title"),
    getTranslations({ locale, namespace: "stories" }),
  ]);
  const home = await getTranslations({ locale, namespace: "home" });
  return (
    <main id="content" className="pb-24">
      <PageHeader pair={pair} lede={t("lede")} />
      <div className="page">
        <PaintingDetail crop="canopy" ratio="3/1" alt={home("canopyAlt")} sizes="100vw" className="mb-12" />
        <TagFilter tags={tags} active={tag} locale={locale} />
        <div className="mt-6">
          <StoryList posts={posts} locale={locale} />
        </div>
      </div>
    </main>
  );
}
