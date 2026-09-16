import { getTranslations } from "next-intl/server";
import { PaintingDetail } from "@/components/painting/PaintingDetail";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

/** Chapter one: the promise, stated at display size beside the knot. */
export async function PromiseSection({ locale }: { locale: Locale }) {
  const [pair, t, hero] = await Promise.all([
    bilingual(locale, "home", "promise"),
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "hero" }),
  ]);
  return (
    <section data-section="promise" className="page section" aria-labelledby="promise-title">
      <hr className="thread-rule" />
      <div className="mt-10 grid gap-10 min-[1024px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-[1024px]:gap-16 min-[1024px]:items-center">
        <div>
          <BilingualHeading as="h2" {...pair} className="display-xl max-w-[22ch]" secondaryClassName="mt-4 text-ink-2" riseSecondary />
          <p className="mt-8 max-w-[52ch] text-xl leading-relaxed text-ink-2">{t("promiseLead")}</p>
          <div className="mt-8">
            <Button href="/get-involved">{hero("tieThread")}</Button>
          </div>
        </div>
        <PaintingDetail crop="knot" ratio="4/5" phoneRatio="4/3" alt={t("knotAlt")} sizes="(min-width: 1024px) 38vw, 100vw" className="max-h-[76vh]" />
      </div>
    </section>
  );
}
