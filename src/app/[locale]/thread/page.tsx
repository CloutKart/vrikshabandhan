import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhotoPanel } from "@/components/media/PhotoPanel";
import { Lineage } from "@/components/thread-page/Lineage";
import { NumbersBlock } from "@/components/thread-page/NumbersBlock";
import { PageHeader } from "@/components/typography/PageHeader";
import { SectionHeading } from "@/components/typography/SectionHeading";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "thread" });
  return pageMeta({ locale: locale as Locale, path: "/thread", title: t("title"), description: t("p3") });
}

export default async function ThreadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const [t, pair, lineageTitle] = await Promise.all([
    getTranslations({ locale, namespace: "thread" }),
    bilingual(locale, "thread", "title"),
    bilingual(locale, "thread", "lineageTitle"),
  ]);
  const entries = t.raw("lineage") as { year: string; place: string; title: string; text: string }[];

  return (
    <main id="content" className="pb-12">
      <PageHeader pair={pair} />
      <div className="page grid gap-12 min-[1024px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-[1024px]:gap-16">
        <div data-prose className="max-w-[60ch] space-y-7 text-xl leading-relaxed">
          <p className="first-letter:float-left first-letter:mr-3 first-letter:text-[4.2rem] first-letter:leading-[0.85] first-letter:text-gold">{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t("p3")}</p>
        </div>
        <aside data-aside className="min-[1024px]:self-start">
          <PhotoPanel name="thread" src="/images/thread-on-bark.jpg" alt={t("photoAlt")} ratio="4/3" position="50% 42%" sizes="(min-width: 1024px) 34vw, 100vw" />
        </aside>
      </div>
      <div className="page section">
        <SectionHeading pair={lineageTitle} />
        <Lineage entries={entries} />
        <NumbersBlock
          title={t("numbersTitle")}
          labels={{ asOf: "", treesPlanted: "Trees planted", treesAlive: "Alive after three monsoons", schools: "Schools", villages: "Villages", volunteers: "Volunteers" }}
        />
      </div>
    </main>
  );
}
