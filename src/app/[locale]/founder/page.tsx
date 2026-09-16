import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Timeline } from "@/components/founder/Timeline";
import { PullQuote } from "@/components/story/PullQuote";
import { PageHeader } from "@/components/typography/PageHeader";
import { SectionHeading } from "@/components/typography/SectionHeading";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "founder" });
  return { title: `${t("title")}: ${t("name")}` };
}

export default async function FounderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "founder" });
  const [pair, years] = await Promise.all([bilingual(locale, "founder", "title"), bilingual(locale, "founder", "timelineTitle")]);
  const timeline = t.raw("timeline") as { year: string; text: string }[];

  return (
    <main id="content" className="pb-12">
      <PageHeader pair={pair} />
      <div className="page grid gap-12 min-[820px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[820px]:grid-rows-[auto_1fr] min-[820px]:gap-x-16 min-[820px]:gap-y-8">
        <div data-reveal="mask" className="overflow-hidden rounded-[var(--radius-panel)] min-[820px]:col-start-1 min-[820px]:row-start-1">
            <Image
              src="/images/founder.jpg"
              alt={t("portraitAlt")}
              width={1199}
              height={902}
              sizes="(min-width: 820px) 40vw, 100vw"
              className="w-full"
              priority
            />
        </div>
        <div className="min-[820px]:col-start-2 min-[820px]:row-span-2">
          <p className="font-sans text-ink-2">{t("honorific")}</p>
          <p className="text-[clamp(2rem,3.5vw,3.25rem)] leading-tight">{t("name")}</p>
          <p className="text-xl text-ink-2">{t("alias")}</p>
          <div className="mt-8 max-w-[60ch] space-y-6 text-lg leading-relaxed">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
          </div>
        </div>
        {/* On phones the quotation follows the biography; on desktop it sits under the portrait. */}
        <PullQuote quote={t("quote")} cite={t("quoteCite")} lang={locale} className="min-[820px]:col-start-1 min-[820px]:row-start-2 min-[820px]:self-start" />
      </div>
      <div className="page section">
        <SectionHeading pair={years} />
        <Timeline items={timeline} />
      </div>
    </main>
  );
}
