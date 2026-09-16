import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Button } from "@/components/ui/Button";
import { otherLocale, type Locale } from "@/i18n/routing";

/**
 * Three layers, pixel-aligned: the painting at the back, the headline in the
 * middle, the cut-out tree in front so the leaves overlap the words. Sized in
 * container units so the overlap is the same at every width. On phones the
 * painting is shown whole and the headline follows it.
 */
export async function Hero({ locale }: { locale: Locale }) {
  const other = otherLocale(locale);
  const t = await getTranslations({ locale, namespace: "hero" });
  const tOther = await getTranslations({ locale: other, namespace: "hero" });
  const credit = t("credit");

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-canvas">
        <div className="hero-art">
          <Image
            src="/images/tree-painting.jpg"
            alt={t("paintingAlt")}
            width={1672}
            height={941}
            priority
            sizes="(min-width: 820px) min(100vw, 153vh), 100vw"
            className="hero-painting"
          />
          <Image
            src="/images/tree-cutout.webp"
            alt=""
            width={1672}
            height={941}
            priority
            sizes="(min-width: 820px) min(100vw, 153vh), 100vw"
            className="hero-cutout"
          />
        </div>
        <BilingualHeading
          as="h1"
          primary={t("title")}
          primaryLang={locale}
          secondary={tOther("title")}
          secondaryLang={other}
          className="hero-title"
        />
      </div>
      <div className="page mt-8 flex flex-col gap-6 min-[820px]:mt-10 min-[820px]:flex-row min-[820px]:items-end min-[820px]:justify-between">
        <p className="max-w-[52ch] text-xl leading-relaxed">{t("lede")}</p>
        <div className="flex flex-wrap gap-3">
          <Button href="/stories">{t("readStories")}</Button>
          <Button href="/get-involved" variant="line">
            {t("tieThread")}
          </Button>
        </div>
      </div>
      {credit ? (
        <p data-credit className="page mt-4 font-sans text-sm text-ink-2">
          {credit}
        </p>
      ) : null}
    </section>
  );
}
