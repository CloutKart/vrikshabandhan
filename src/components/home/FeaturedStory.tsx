import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { SectionAction } from "@/components/typography/SectionAction";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { otherLocale, type Locale } from "@/i18n/routing";
import { mediaUrl, pick } from "@/lib/content/posts";
import type { Post } from "@/lib/content/types";
import { formatStoryDate } from "@/lib/i18n/format";

/**
 * The newest story as a band right under the hero: its cover on the left and
 * the words on the right from 820 px up, the cover on top on phones. Without a
 * cover the words take the band alone. The three-story list further down (and
 * in the hero's right column on wide screens) stays; this is the one to read
 * first.
 */
export async function FeaturedStory({ locale, post }: { locale: Locale; post: Post | null }) {
  if (!post) return null;
  const t = await getTranslations({ locale, namespace: "home" });
  const other = otherLocale(locale);
  const title = pick(post, "title", locale);
  const otherTitle = other === "hi" ? post.title_hi : post.title_en;
  const summary = pick(post, "summary", locale);
  const cover = post.media.find((m) => m.type === "image");
  const coverAlt = locale === "hi" && cover?.alt_hi ? cover.alt_hi : cover?.alt_en;

  return (
    <section data-section="featured" aria-labelledby="featured-label" className="page mt-10 min-[820px]:mt-14">
      <hr className="rule" />
      <p id="featured-label" className="mt-6 font-sans text-sm text-ink-2">
        {t("featured")}
      </p>
      <article data-cover={cover ? "true" : "false"} className="mt-5 grid gap-6 min-[820px]:gap-12 min-[820px]:items-center min-[820px]:data-[cover=true]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {cover ? (
          <div data-flip-id={post.slug} data-reveal="mask" className="painting-detail framed relative overflow-hidden rounded-[var(--radius-panel)] bg-ground-2" style={{ "--ratio": "4 / 3", "--ratio-phone": "16 / 9" } as CSSProperties}>
            <Image src={mediaUrl(cover)} alt={coverAlt ?? ""} fill sizes="(min-width: 820px) 42vw, 100vw" quality={75} className="object-cover" />
          </div>
        ) : null}
        <div className={cover ? "" : "max-w-[62ch]"}>
          <p className="font-sans text-sm">
            <time dateTime={post.date} className="text-gold">
              {formatStoryDate(post.date, locale)}
            </time>
            {post.place ? <span className="text-ink-2">, {post.place}</span> : null}
          </p>
          <h2 className="mt-3 text-[clamp(2rem,3.6vw,3.5rem)] leading-tight">
            <Link href={`/stories/${post.slug}`} className="u-thread" lang={title.lang}>
              {title.text}
            </Link>
          </h2>
          {otherTitle ? (
            <p lang={other} className="mt-2 text-xl text-ink-2">
              {otherTitle}
            </p>
          ) : null}
          {summary.text ? (
            <p lang={summary.lang} className="mt-5 max-w-[52ch] text-xl leading-relaxed text-ink-2">
              {summary.text}
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Button href={`/stories/${post.slug}`}>{t("readStory")}</Button>
            <SectionAction href="/stories">{t("allStories")}</SectionAction>
          </div>
        </div>
      </article>
    </section>
  );
}
