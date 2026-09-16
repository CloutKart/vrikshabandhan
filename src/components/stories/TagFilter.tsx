import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Tag filters as links, so a filtered list has an address. The current one carries aria-current. */
export async function TagFilter({ tags, active, locale }: { tags: string[]; active?: string; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "stories" });
  const chip = "u-thread inline-flex min-h-11 items-center px-1 font-sans text-base";
  return (
    <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-x-6 gap-y-1">
      <Link href="/stories" className={chip} aria-current={active ? undefined : "page"}>
        {t("all")}
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={{ pathname: "/stories", query: { tag } }}
          className={chip}
          aria-current={active === tag ? "page" : undefined}
        >
          {tag}
        </Link>
      ))}
    </nav>
  );
}
