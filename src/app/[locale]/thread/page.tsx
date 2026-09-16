import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lineage } from "@/components/thread-page/Lineage";
import { NumbersBlock } from "@/components/thread-page/NumbersBlock";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { PageHeader } from "@/components/typography/PageHeader";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "thread" });
  return { title: t("title") };
}

export default async function ThreadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "thread" });
  const [pair, lineageTitle] = await Promise.all([bilingual(locale, "thread", "title"), bilingual(locale, "thread", "lineageTitle")]);
  const entries = t.raw("lineage") as { year: string; place: string; title: string; text: string }[];

  return (
    <main id="content" className="pb-24">
      <PageHeader pair={pair} />
      <div className="page">
        <div className="max-w-[60ch] space-y-6 text-xl leading-relaxed">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>
        <BilingualHeading as="h2" {...lineageTitle} className="mt-20 text-[2rem] leading-tight" secondaryClassName="text-ink-2" />
        <Lineage entries={entries} />
        <NumbersBlock
          title={t("numbersTitle")}
          labels={{ asOf: "", treesPlanted: "Trees planted", treesAlive: "Alive after three monsoons", schools: "Schools", villages: "Villages", volunteers: "Volunteers" }}
        />
      </div>
    </main>
  );
}
