import { getTranslations } from "next-intl/server";
import { SectionAction } from "@/components/typography/SectionAction";
import { SectionHeading } from "@/components/typography/SectionHeading";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

type Entry = { year: string; place: string; title: string; text: string };

/** Chapter two: the four movements this one stands in, years at display size. */
export async function LineageStrip({ locale }: { locale: Locale }) {
  const [pair, t, home] = await Promise.all([
    bilingual(locale, "thread", "lineageTitle"),
    getTranslations({ locale, namespace: "thread" }),
    getTranslations({ locale, namespace: "home" }),
  ]);
  const entries = t.raw("lineage") as Entry[];
  return (
    <section data-section="lineage" className="page section" aria-labelledby="lineage-title">
      <SectionHeading
        pair={pair}
        action={<SectionAction href="/thread">{home("lineageCta")}</SectionAction>}
      />
      <ol className="mt-10 grid gap-x-8 gap-y-8 max-[639px]:mt-8 max-[639px]:gap-y-6 min-[640px]:grid-cols-2 min-[640px]:gap-y-12 min-[1024px]:grid-cols-4">
        {entries.map((e) => (
          <li key={e.year} className="border-t border-moss/60 pt-6">
            <time dateTime={e.year} className="numeral-xl block max-[639px]:text-[2.25rem]">
              {e.year}
            </time>
            <p className="mt-4 text-[1.6rem] leading-tight max-[639px]:mt-2 max-[639px]:text-[1.4rem]">{e.title}</p>
            <p className="mt-1 font-sans text-sm text-ink-2">{e.place}</p>
            <p className="mt-4 max-w-[36ch] text-ink-2 max-[639px]:mt-3 max-[639px]:text-base">{e.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
