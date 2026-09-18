import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UnsubscribeCard } from "@/components/newsletter/TokenCard";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";
import { newsletterLabels } from "@/lib/newsletter/strings";
import { isToken } from "@/lib/newsletter/validate";
import { pageMeta } from "@/lib/seo";
import { subscribe, unsubscribe } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletter" });
  return pageMeta({ locale: locale as Locale, path: "/newsletter/unsubscribe", title: t("unsubMeta"), noIndex: true });
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const raw = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  const token = isToken(raw) ? raw : null;
  const [t, pair] = await Promise.all([getTranslations({ locale, namespace: "newsletter" }), bilingual(locale, "newsletter", "unsubTitle")]);
  const copy = {
    text: t("unsubText"),
    cta: t("unsubCta"),
    done: t("unsubDone"),
    failed: t("unsubInvalid"),
    resubscribe: t("resubscribe"),
    readStories: t("readStories"),
    languageEn: t("languageEn"),
    languageHi: t("languageHi"),
  };
  return (
    <main id="content" className="page pb-24 pt-10 min-[820px]:pt-16">
      <div data-token-card className="paper mx-auto w-full max-w-[42rem] rounded-[var(--radius-panel)]">
        <div className="border-b-2 border-sutra pb-6">
          <BilingualHeading as="h1" {...pair} className="text-[clamp(2rem,3vw,2.75rem)] leading-tight" secondaryClassName="text-paper-ink-2" />
        </div>
        <div className="mt-8">
          <UnsubscribeCard token={token} locale={locale} copy={copy} labels={newsletterLabels(t)} action={unsubscribe} subscribeAction={subscribe} />
        </div>
      </div>
    </main>
  );
}
