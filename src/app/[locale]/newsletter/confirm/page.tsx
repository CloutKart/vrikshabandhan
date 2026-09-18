import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConfirmCard } from "@/components/newsletter/TokenCard";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";
import { newsletterLabels } from "@/lib/newsletter/strings";
import { isToken } from "@/lib/newsletter/validate";
import { pageMeta } from "@/lib/seo";
import { confirm, subscribe } from "../actions";

export const dynamic = "force-dynamic";

const HEADING = "text-[clamp(2rem,3vw,2.75rem)] leading-tight";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletter" });
  return pageMeta({ locale: locale as Locale, path: "/newsletter/confirm", title: t("confirmMeta"), noIndex: true });
}

export default async function ConfirmPage({ params, searchParams }: Props) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const raw = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  const token = isToken(raw) ? raw : null;
  const [t, pair, donePair] = await Promise.all([
    getTranslations({ locale, namespace: "newsletter" }),
    bilingual(locale, "newsletter", "confirmTitle"),
    bilingual(locale, "newsletter", "confirmDoneTitle"),
  ]);
  const copy = {
    text: t("confirmText"),
    cta: t("confirmCta"),
    done: t("confirmed"),
    failed: t("expired"),
    resubscribe: t("resubscribe"),
    readStories: t("readStories"),
    languageEn: t("languageEn"),
    languageHi: t("languageHi"),
  };
  return (
    <main id="content" className="page pb-24 pt-10 min-[820px]:pt-16">
      <div data-token-card className="paper mx-auto w-full max-w-[42rem] rounded-[var(--radius-panel)]">
        <ConfirmCard
          token={token}
          locale={locale}
          copy={copy}
          labels={newsletterLabels(t)}
          heading={<BilingualHeading as="h1" {...pair} className={HEADING} secondaryClassName="text-paper-ink-2" />}
          doneHeading={<BilingualHeading as="h1" {...donePair} className={HEADING} secondaryClassName="text-paper-ink-2" />}
          action={confirm}
          subscribeAction={subscribe}
        />
      </div>
    </main>
  );
}
