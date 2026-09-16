import { getTranslations } from "next-intl/server";
import { otherLocale, type Locale } from "@/i18n/routing";

export type Pair = { primary: string; primaryLang: Locale; secondary: string; secondaryLang: Locale };

/** One message key in the page's language and in the other one, for bilingual headings. */
export async function bilingual(locale: Locale, namespace: string, key: string): Promise<Pair> {
  const other = otherLocale(locale);
  const [t, tOther] = await Promise.all([
    getTranslations({ locale, namespace }),
    getTranslations({ locale: other, namespace }),
  ]);
  return { primary: t(key), primaryLang: locale, secondary: tOther(key), secondaryLang: other };
}
