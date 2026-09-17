import { getImageProps } from "next/image";
import { getTranslations } from "next-intl/server";
import { HeroLeaves } from "@/components/hero/HeroLeaves";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Button } from "@/components/ui/Button";
import type { ReactNode } from "react";
import { otherLocale, type Locale } from "@/i18n/routing";

/**
 * Three layers, pixel-aligned: the painting at the back, the headline in the
 * middle, the cut-out tree in front so the leaves overlap the words. Sized in
 * container units so the overlap is the same at every width. Two paintings:
 * the wide one (1672x941) on desktop, the square one (1254x1254) on phones,
 * chosen by the browser through <picture>, so only one is ever fetched.
 */
const PHONE = "(max-width: 819px)";
const DESKTOP = "(min-width: 820px)";
const WIDE_SIZES = "(min-width: 820px) min(100vw, 153vh), 100vw";
const WIDE = { width: 1672, height: 941 };
const SQUARE = { width: 1254, height: 1254 };

type Variant = "dark" | "light";

/** A painting layer in both frames: the wide image with the square one as the phone source. */
function Painting({ wide, square, alt, variant, priority, quality, className }: { wide: string; square: string; alt: string; variant: Variant; priority?: boolean; quality: number; className: string }) {
  const { props: img } = getImageProps({ src: wide, alt, quality, sizes: WIDE_SIZES, priority, loading: priority ? undefined : "lazy", ...WIDE });
  const { props: sq } = getImageProps({ src: square, alt, quality, sizes: "100vw", ...SQUARE });
  return (
    <picture>
      <source media={PHONE} srcSet={sq.srcSet} sizes="100vw" />
      <img {...img} alt={alt} className={className} data-variant={variant} />
    </picture>
  );
}

/** A small unoptimised patch (the thread) in both frames. */
function Patch({ wide, square, variant, className, size }: { wide: string; square: string; variant: Variant; className: string; size: { width: number; height: number } }) {
  return (
    <picture>
      <source media={PHONE} srcSet={square} />
      <img src={wide} alt="" width={size.width} height={size.height} loading="lazy" decoding="async" className={className} data-variant={variant} />
    </picture>
  );
}

/** getImageProps does not preload, so the two priority layers get their own links, one per frame. */
function Preload({ wide, square, quality }: { wide: string; square: string; quality: number }) {
  const { props: w } = getImageProps({ src: wide, alt: "", quality, sizes: WIDE_SIZES, ...WIDE });
  const { props: s } = getImageProps({ src: square, alt: "", quality, sizes: "100vw", ...SQUARE });
  return (
    <>
      <link rel="preload" as="image" imageSrcSet={w.srcSet} imageSizes={w.sizes} media={DESKTOP} fetchPriority="high" />
      <link rel="preload" as="image" imageSrcSet={s.srcSet} imageSizes="100vw" media={PHONE} fetchPriority="high" />
    </>
  );
}

export async function Hero({ locale, aside }: { locale: Locale; aside?: ReactNode }) {
  const other = otherLocale(locale);
  const t = await getTranslations({ locale, namespace: "hero" });
  const tOther = await getTranslations({ locale: other, namespace: "hero" });
  const credit = t("credit");
  const paintingAlt = t("paintingAlt");

  return (
    <section className="hero page" aria-labelledby="hero-title">
      <Preload wide="/images/canvas.jpg" square="/images/canvas-sq.jpg" quality={55} />
      <Preload wide="/images/tree-cutout.webp" square="/images/tree-cutout-sq.webp" quality={70} />
      <div className="hero-grid">
      <div className="hero-canvas">
        <div className="hero-art">
          {/* Layers, back to front: the bare canvas (one per theme), the headline, the falling leaves, the tree (a still
              image, or the WebGL canvas that moves it), then the thread in two parts: the band with the knot, and the
              loose ends. Hidden variants are lazy, so they are never fetched. */}
          <Painting wide="/images/canvas.jpg" square="/images/canvas-sq.jpg" alt="" variant="dark" priority quality={55} className="hero-painting" />
          <Painting wide="/images/canvas-light.jpg" square="/images/canvas-sq-light.jpg" alt="" variant="light" quality={55} className="hero-painting" />
          <Painting wide="/images/tree-cutout.webp" square="/images/tree-cutout-sq.webp" alt={paintingAlt} variant="dark" priority quality={70} className="hero-cutout hero-tree" />
          <Painting wide="/images/tree-cutout-light.webp" square="/images/tree-cutout-sq-light.webp" alt={paintingAlt} variant="light" quality={70} className="hero-cutout hero-tree" />
          <Patch wide="/images/thread-band.png" square="/images/thread-band-sq.png" variant="dark" className="hero-cutout hero-thread-band" size={{ width: 190, height: 56 }} />
          <Patch wide="/images/thread-band-light.png" square="/images/thread-band-sq-light.png" variant="light" className="hero-cutout hero-thread-band" size={{ width: 190, height: 56 }} />
          <Patch wide="/images/tassel.png" square="/images/tassel-sq.png" variant="dark" className="hero-cutout hero-tassel" size={{ width: 150, height: 102 }} />
          <Patch wide="/images/tassel-light.png" square="/images/tassel-sq-light.png" variant="light" className="hero-cutout hero-tassel" size={{ width: 150, height: 102 }} />
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
