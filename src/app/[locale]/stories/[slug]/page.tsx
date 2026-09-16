import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PaperSheet } from "@/components/story/PaperSheet";
import { StoryBody } from "@/components/story/StoryBody";
import { StoryCover, StoryGallery, YouTubeEmbed } from "@/components/story/StoryMedia";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Link } from "@/i18n/navigation";
import { otherLocale, routing, type Locale } from "@/i18n/routing";
import { builtinPosts } from "@/lib/content/builtin";
import { getPost, mediaUrl, pick } from "@/lib/content/posts";
import { formatStoryDate } from "@/lib/i18n/format";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => builtinPosts.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const post = await getPost(slug);
  if (!post) return {};
  const cover = post.media.find((m) => m.type === "image");
  return {
    title: pick(post, "title", locale).text,
    description: pick(post, "summary", locale).text,
    openGraph: cover ? { images: [{ url: mediaUrl(cover) }] } : undefined,
  };
}

export default async function StoryPage({ params }: Props) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const post = await getPost(slug);
  if (!post) notFound();
  const t = await getTranslations({ locale, namespace: "stories" });
  const other = otherLocale(locale);
  const title = pick(post, "title", locale);
  const otherTitle = other === "hi" ? post.title_hi : post.title_en;
  const body = pick(post, "body", locale);
  const [cover, ...rest] = post.media;

  return (
    <main id="content" className="page pb-24 pt-10 min-[820px]:pt-16">
      <p className="mb-8 font-sans">
        <Link href="/stories" className="u-thread">
          {t("back")}
        </Link>
      </p>
      <PaperSheet>
        {cover ? (
          <div className="-mx-[clamp(1.25rem,5vw,4rem)] -mt-[clamp(1.25rem,5vw,4rem)] mb-10">
            <StoryCover media={cover} locale={locale} />
          </div>
        ) : null}
        <p className="font-sans text-sm text-paper-ink-2">
          <time dateTime={post.date} className="block">
            {formatStoryDate(post.date, locale)}
          </time>
          {post.place ? <span className="block">{post.place}</span> : null}
        </p>
        <BilingualHeading
          as="h1"
          primary={title.text}
          primaryLang={title.lang}
          secondary={otherTitle || undefined}
          secondaryLang={other}
          className="mt-6 text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-[-0.015em]"
          secondaryClassName="mt-3 text-paper-ink-2"
        />
        {locale === "hi" && body.lang === "en" ? (
          <p lang="hi" className="mt-6 font-sans text-sm text-paper-ink-2">
            {t("onlyEnglish")}
          </p>
        ) : null}
        <StoryBody body={body.text} lang={body.lang} />
        <YouTubeEmbed url={post.yt} title={`${t("video")}: ${title.text}`} />
        <StoryGallery items={rest} locale={locale} title={t("gallery")} />
      </PaperSheet>
    </main>
  );
}
