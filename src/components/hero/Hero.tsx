import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HeroLeaves } from "@/components/hero/HeroLeaves";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Button } from "@/components/ui/Button";
import type { ReactNode } from "react";
import { otherLocale, type Locale } from "@/i18n/routing";

/**
 * Three layers, pixel-aligned: the painting at the back, the headline in the
 * middle, the cut-out tree in front so the leaves overlap the words. Sized in
 * container units so the overlap is the same at every width. On phones the
 * painting is shown whole and the headline follows it.
 */
export async function Hero({ locale, aside }: { locale: Locale; aside?: ReactNode }) {
  const other = otherLocale(locale);
  const t = await getTranslations({ locale, namespace: "hero" });
  const tOther = await getTranslations({ locale: other, namespace: "hero" });
  const credit = t("credit");

  return (
    <section className="hero page" aria-labelledby="hero-title">
      <div className="hero-grid">
      <div className="hero-canvas">
        <div className="hero-art">
          {/* Layers, back to front: the bare canvas (one per theme), the headline, the falling leaves, the tree (a still
              image, or the WebGL canvas that moves it), then the thread in two parts: the band with the knot, and the
              loose ends. Hidden variants are lazy, so they are never fetched. */}
          <Image src="/images/canvas.jpg" alt="" width={1672} height={941} priority fetchPriority="high" quality={55} sizes="(min-width: 820px) min(100vw, 153vh), 100vw" className="hero-painting" data-variant="dark" />
          <Image src="/images/canvas-light.jpg" alt="" width={1672} height={941} loading="lazy" quality={55} sizes="(min-width: 820px) min(100vw, 153vh), 100vw" className="hero-painting" data-variant="light" />
          <Image src="/images/tree-cutout.webp" alt={t("paintingAlt")} width={1672} height={941} priority fetchPriority="high" quality={70} sizes="(min-width: 820px) min(100vw, 153vh), 100vw" className="hero-cutout hero-tree" data-variant="dark" />
          <Image src="/images/tree-cutout-light.webp" alt={t("paintingAlt")} width={1672} height={941} loading="lazy" quality={70} sizes="(min-width: 820px) min(100vw, 153vh), 100vw" className="hero-cutout hero-tree" data-variant="light" />
          <Image src="/images/thread-band.png" unoptimized alt="" width={190} height={56} loading="lazy" className="hero-cutout hero-thread-band" data-variant="dark" />
          <Image src="/images/thread-band-light.png" unoptimized alt="" width={190} height={56} loading="lazy" className="hero-cutout hero-thread-band" data-variant="light" />
          <Image src="/images/tassel.png" unoptimized alt="" width={150} height={102} loading="lazy" className="hero-cutout hero-tassel" data-variant="dark" />
          <Image src="/images/tassel-light.png" unoptimized alt="" width={150} height={102} loading="lazy" className="hero-cutout hero-tassel" data-variant="light" />
          <HeroLeaves />
        </div>
        <BilingualHeading
          as="h1"
          primary={t("title")}
          primaryLang={locale}
          secondary={tOther("title")}
          secondaryLang={other}
          className="hero-title"
          reveal="hero"
        />
      </div>
      <div className="hero-copy">
        <p className="max-w-[52ch] text-xl leading-relaxed">{t("lede")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/stories">{t("readStories")}</Button>
          <Button href="/get-involved" variant="line">
            {t("tieThread")}
          </Button>
        </div>
      </div>
      {aside}
      </div>
      {credit ? (
        <p data-credit className="mt-4 font-sans text-sm text-ink-2">
          {credit}
        </p>
      ) : null}
    </section>
  );
}
