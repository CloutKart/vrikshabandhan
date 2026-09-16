import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { otherLocale, type Locale } from "@/i18n/routing";
import { mediaUrl, pick } from "@/lib/content/posts";
import type { Post } from "@/lib/content/types";
import { formatStoryDate } from "@/lib/i18n/format";

/**
 * One story as a row, not a card: date and place in the margin column, the
 * title in both scripts, the summary, and a small cover when one exists.
 */
export async function StoryLink({ post, locale }: { post: Post; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "stories" });
  const title = pick(post, "title", locale);
  const other = otherLocale(locale);
  const otherTitle = other === "hi" ? post.title_hi : post.title_en;
  const summary = pick(post, "summary", locale);
  const cover = post.media.find((m) => m.type === "image");
  const coverAlt = locale === "hi" && cover?.alt_hi ? cover.alt_hi : cover?.alt_en;

  return (
    <li data-story-row className="grid gap-3 py-8 min-[820px]:grid-cols-[9rem_1fr_11rem] min-[820px]:gap-10">
      <div className="font-sans text-sm text-ink-2">
        <time dateTime={post.date} className="block text-gold">
          {formatStoryDate(post.date, locale)}
        </time>
        {post.place ? <span className="block">{post.place}</span> : null}
        {!post.live ? <span className="block">{t("draft")}</span> : null}
      </div>
      <div>
        <h3 className="text-[1.75rem] leading-tight">
          <Link href={`/stories/${post.slug}`} className="u-thread" lang={title.lang}>
            {title.text}
          </Link>
        </h3>
        {otherTitle ? (
          <p lang={other} className="mt-1 text-lg text-ink-2">
            {otherTitle}
          </p>
        ) : null}
        {summary.text ? (
          <p lang={summary.lang} className="mt-4 max-w-[60ch]">
            {summary.text}
          </p>
        ) : null}
        {post.tags.length ? (
          <p className="mt-4 font-sans text-sm text-ink-2">{post.tags.join(", ")}</p>
        ) : null}
      </div>
      {cover ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-ground-2 min-[820px]:mt-1">
          <Image src={mediaUrl(cover)} alt={coverAlt ?? ""} fill sizes="(min-width: 820px) 11rem, 100vw" className="object-cover" />
        </div>
      ) : null}
    </li>
  );
}
