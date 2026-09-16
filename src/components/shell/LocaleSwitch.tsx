"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { otherLocale, type Locale } from "@/i18n/routing";

/**
 * Same page, other language. The visible text is in the target language, so
 * it carries that lang. With motion allowed, the page fades out before the
 * route changes and the new page fades in (see globals.css).
 */
export function LocaleSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const target = otherLocale(locale);
  return (
    <Link
      href={pathname}
      locale={target}
      aria-label={`${t("switchLocale")} (${t("switchLocaleLabel")})`}
      className="u-thread font-sans"
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const main = document.querySelector("main");
        if (!main || document.documentElement.dataset.motion !== "full") return;
        e.preventDefault();
        main.setAttribute("data-switching", "");
        window.setTimeout(() => router.replace(pathname, { locale: target }), 150);
      }}
    >
      <span lang={target}>{t("switchLocale")}</span>
    </Link>
  );
}
