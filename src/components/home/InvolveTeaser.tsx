import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/typography/SectionHeading";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

const ways = ["adopt", "host", "support"] as const;

/** The closing ask: three ways, one action. */
export async function InvolveTeaser({ locale }: { locale: Locale }) {
  const [pair, t, home] = await Promise.all([
    bilingual(locale, "involve", "title"),
    getTranslations({ locale, namespace: "involve" }),
    getTranslations({ locale, namespace: "home" }),
  ]);
  return (
    <section data-section="involve" className="page section" aria-labelledby="involve-title">
      <SectionHeading pair={pair} />
      <ol className="mt-10 grid gap-10 min-[1024px]:grid-cols-3">
        {ways.map((w) => (
          <li key={w} className="border-t border-moss/60 pt-6">
            <h3 className="text-[1.75rem] leading-tight">{t(`${w}Title`)}</h3>
            <p className="mt-3 max-w-[40ch] text-ink-2">{t(`${w}Text`)}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10">
        <Button href="/get-involved">{home("involveCta")}</Button>
      </div>
    </section>
  );
}
