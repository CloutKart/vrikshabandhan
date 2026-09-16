import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/typography/SectionHeading";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

/** Chapter three: the person behind thirty years, after the work has spoken. */
export async function FounderTeaser({ locale }: { locale: Locale }) {
  const [pair, t, home] = await Promise.all([
    bilingual(locale, "founder", "title"),
    getTranslations({ locale, namespace: "founder" }),
    getTranslations({ locale, namespace: "home" }),
  ]);
  return (
    <section data-section="founder" className="page section" aria-labelledby="founder-title">
      <SectionHeading pair={pair} />
      <div className="mt-10 grid gap-10 min-[1024px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[1024px]:gap-16 min-[1024px]:items-center">
        <div data-reveal="mask" className="overflow-hidden rounded-[var(--radius-panel)]">
          <Image src="/images/founder.jpg" alt={t("portraitAlt")} width={1199} height={902} sizes="(min-width: 1024px) 40vw, 100vw" className="w-full" />
        </div>
        <div>
          <p className="font-sans text-ink-2">{t("honorific")}</p>
          <p className="text-[clamp(2rem,3.5vw,3.25rem)] leading-tight">{t("name")}</p>
          <p className="text-xl text-ink-2">{t("alias")}</p>
          <p className="mt-6 max-w-[52ch] text-xl leading-relaxed">{home("founderLead")}</p>
          <div className="mt-8">
            <Button href="/founder" variant="line">
              {home("founderCta")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
