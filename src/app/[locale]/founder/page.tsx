import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Timeline } from "@/components/founder/Timeline";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { PageHeader } from "@/components/typography/PageHeader";
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
    <main id="content" className="pb-24">
      <PageHeader pair={pair} />
      <div className="page grid gap-12 min-[820px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[820px]:gap-16">
        <div>
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
        <div>
          <p className="font-sans text-ink-2">{t("honorific")}</p>
          <p className="text-[2.25rem] leading-tight">{t("name")}</p>
          <p className="text-xl text-ink-2">{t("alias")}</p>
          <div className="mt-8 max-w-[60ch] space-y-6">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
          </div>
          <BilingualHeading as="h2" {...years} className="mt-16 text-[2rem] leading-tight" secondaryClassName="text-ink-2" />
          <Timeline items={timeline} />
        </div>
      </div>
    </main>
  );
}
