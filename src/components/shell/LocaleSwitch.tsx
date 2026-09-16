"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { otherLocale, type Locale } from "@/i18n/routing";

/** Same page, other language. The visible text is in the target language, so it carries that lang. */
export function LocaleSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("nav");
  const target = otherLocale(locale);
  return (
    <Link
      href={pathname}
      locale={target}
      aria-label={t("switchLocaleLabel")}
      className="u-thread font-sans"
    >
      <span lang={target}>{t("switchLocale")}</span>
    </Link>
  );
}
