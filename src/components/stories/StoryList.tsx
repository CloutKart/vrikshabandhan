import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { Post } from "@/lib/content/types";
import { StoryLink } from "./StoryLink";

export async function StoryList({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "stories" });
  if (!posts.length) return <p className="py-12 font-sans text-ink-2">{t("empty")}</p>;
  return (
    <ol data-story-list className="divide-y divide-moss/40">
      {posts.map((post) => (
        <StoryLink key={post.slug} post={post} locale={locale} />
      ))}
    </ol>
  );
}
