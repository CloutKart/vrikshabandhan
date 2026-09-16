import { getTranslations } from "next-intl/server";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPosts } from "@/lib/content/posts";
import { bilingual } from "@/lib/i18n/bilingual";
import { StoryList } from "./StoryList";

export async function LatestStories({ locale }: { locale: Locale }) {
  const [posts, pair, t] = await Promise.all([
    getPosts({ limit: 3 }),
    bilingual(locale, "home", "latest"),
    getTranslations({ locale, namespace: "home" }),
  ]);
  return (
    <section className="page mt-24" aria-labelledby="latest-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BilingualHeading as="h2" {...pair} className="text-[2.25rem] leading-tight" secondaryClassName="text-ink-2" />
        <Link href="/stories" className="u-thread font-sans">
          {t("allStories")}
        </Link>
      </div>
      <div className="mt-6">
        <StoryList posts={posts} locale={locale} />
      </div>
    </section>
  );
}
