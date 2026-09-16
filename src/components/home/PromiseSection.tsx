import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

/** Chapter one: the promise, stated at display size beside the founder planting a sapling. */
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
        {/* The site's first field photograph: a portrait panel on desktop, a short band on phones. */}
        <div
          data-photo="planting"
          data-reveal="mask"
          className="painting-detail relative max-h-[76vh] overflow-hidden rounded-[var(--radius-panel)] bg-stone"
          style={{ "--ratio": "4 / 5", "--ratio-phone": "4 / 3" } as CSSProperties}
        >
          <Image
            src="/images/planting.jpg"
            alt={t("plantingAlt")}
            fill
            sizes="(min-width: 1024px) 38vw, 100vw"
            quality={70}
            className="object-cover"
            style={{ objectPosition: "50% 58%" }}
          />
        </div>
      </div>
    </section>
  );
}
