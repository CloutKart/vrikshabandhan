import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Tag filters as links, so a filtered list has an address. The current one carries aria-current. */
export async function TagFilter({ tags, active, locale }: { tags: string[]; active?: string; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "stories" });
  const chip = "u-thread inline-flex min-h-11 shrink-0 items-center px-1 font-sans text-base";
  // One row that scrolls sideways on phones, bleeding to the screen edges; wrapping rows on desktop.
  return (
    <nav
      aria-label={t("filterLabel")}
      className="flex flex-wrap gap-x-6 gap-y-1 max-[819px]:-mx-5 max-[819px]:flex-nowrap max-[819px]:overflow-x-auto max-[819px]:px-5 max-[819px]:[scroll-padding-inline:1.25rem] max-[819px]:[scrollbar-width:none] max-[819px]:[&::-webkit-scrollbar]:hidden"
    >
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
