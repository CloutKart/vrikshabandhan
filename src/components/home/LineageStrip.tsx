import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/typography/SectionHeading";
import { Link } from "@/i18n/navigation";
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
        action={
          <Link href="/thread" className="inline-flex min-h-11 items-center font-sans">
            <span className="u-thread">{home("lineageCta")}</span>
          </Link>
        }
      />
      <ol className="mt-12 grid gap-x-8 gap-y-12 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-4">
        {entries.map((e) => (
          <li key={e.year} className="border-t border-moss/60 pt-6">
            <time dateTime={e.year} className="numeral-xl block">
              {e.year}
            </time>
            <p className="mt-4 text-[1.6rem] leading-tight">{e.title}</p>
            <p className="mt-1 font-sans text-sm text-ink-2">{e.place}</p>
            <p className="mt-4 max-w-[36ch] text-ink-2">{e.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
