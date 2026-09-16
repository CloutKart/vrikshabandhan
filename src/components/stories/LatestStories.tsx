import { getTranslations } from "next-intl/server";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Link } from "@/i18n/navigation";
import { otherLocale, type Locale } from "@/i18n/routing";
import { getPosts, pick } from "@/lib/content/posts";
import type { Post } from "@/lib/content/types";
import { bilingual } from "@/lib/i18n/bilingual";
import { formatStoryDate } from "@/lib/i18n/format";
import { StoryList } from "./StoryList";

type Props = { locale: Locale; posts?: Post[]; variant?: "section" | "compact" };

/**
 * The three latest stories. As a section it renders full rows below the hero;
 * as "compact" it renders short rows for the hero's right column on wide
 * screens. The page renders both and CSS shows exactly one.
 */
export async function LatestStories({ locale, posts, variant = "section" }: Props) {
  const [list, pair, t] = await Promise.all([
    posts ?? getPosts({ limit: 3 }),
    bilingual(locale, "home", "latest"),
    getTranslations({ locale, namespace: "home" }),
  ]);
  const other = otherLocale(locale);
  const id = variant === "compact" ? "latest-title-compact" : "latest-title";

  if (variant === "compact") {
    return (
      <section aria-labelledby={id} className="hero-aside">
        <BilingualHeading as="h2" {...pair} className="text-[1.75rem] leading-tight" secondaryClassName="text-ink-2" />
        <ol data-story-list className="mt-4 divide-y divide-moss/40">
          {list.map((post) => {
            const title = pick(post, "title", locale);
            const otherTitle = other === "hi" ? post.title_hi : post.title_en;
            return (
              <li key={post.slug} data-story-row className="py-4">
                <time dateTime={post.date} className="block font-sans text-sm text-gold">
                  {formatStoryDate(post.date, locale)}
                </time>
                <h3 className="mt-1 text-[1.35rem] leading-tight">
                  <Link href={`/stories/${post.slug}`} className="u-thread" lang={title.lang}>
                    {title.text}
                  </Link>
                </h3>
                {otherTitle ? (
                  <p lang={other} className="mt-1 text-base text-ink-2">
                    {otherTitle}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="mt-4">
          <Link href="/stories" className="inline-flex min-h-11 items-center font-sans">
            <span className="u-thread">{t("allStories")}</span>
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page hero-latest-fallback mt-24" aria-labelledby={id}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BilingualHeading as="h2" {...pair} className="text-[2.25rem] leading-tight" secondaryClassName="text-ink-2" riseSecondary />
        <Link href="/stories" className="inline-flex min-h-11 items-center font-sans">
          <span className="u-thread">{t("allStories")}</span>
        </Link>
      </div>
      <div className="mt-6">
        <StoryList posts={list} locale={locale} />
      </div>
    </section>
  );
}
