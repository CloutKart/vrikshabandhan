import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhotoPanel } from "@/components/media/PhotoPanel";
import { StoryList } from "@/components/stories/StoryList";
import { TagFilter } from "@/components/stories/TagFilter";
import { NewsletterBlock } from "@/components/newsletter/NewsletterBlock";
import { PageHeader } from "@/components/typography/PageHeader";
import type { Locale } from "@/i18n/routing";
import { getPosts, getTags } from "@/lib/content/posts";
import { bilingual } from "@/lib/i18n/bilingual";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ tag?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stories" });
  return pageMeta({ locale: locale as Locale, path: "/stories", title: t("title"), description: t("lede") });
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
  return (
    <main id="content" className="pb-24">
      <PageHeader
        pair={pair}
        lede={t("lede")}
        aside={<PhotoPanel name="stream" src="/images/founder-stream.jpg" alt={t("headerAlt")} ratio="16/9" position="50% 38%" sizes="(min-width: 1024px) 38vw, 100vw" />}
      />
      <div className="page">
        <TagFilter tags={tags} active={tag} locale={locale} />
        <div className="mt-6">
          <StoryList posts={posts} locale={locale} />
        </div>
        <NewsletterBlock locale={locale} variant="panel" />
      </div>
    </main>
  );
}
