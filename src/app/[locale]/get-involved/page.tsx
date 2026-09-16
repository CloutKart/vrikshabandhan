import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BilingualHeading } from "@/components/typography/BilingualHeading";
import { PageHeader } from "@/components/typography/PageHeader";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { bilingual } from "@/lib/i18n/bilingual";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "involve" });
  return { title: t("title"), description: t("lede") };
}

const ways = ["adopt", "host", "support"] as const;

export default async function GetInvolvedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "involve" });
  const [pair, contactPair] = await Promise.all([bilingual(locale, "involve", "title"), bilingual(locale, "involve", "contactTitle")]);
  const tel = (s: string) => `tel:${s.replace(/\s+/g, "")}`;
  const link = "u-thread";

  return (
    <main id="content" className="pb-24">
      <PageHeader pair={pair} lede={t("lede")} />
      <div className="page">
        <ol className="divide-y divide-moss/40">
          {ways.map((w) => (
            <li key={w} className="grid gap-4 py-10 min-[820px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[820px]:gap-16">
              <h2 className="text-[2rem] leading-tight">{t(`${w}Title`)}</h2>
              <div>
                <p className="max-w-[56ch]">{t(`${w}Text`)}</p>
                <div className="mt-6">
                  <Button href="/get-involved#contact" variant="line">
                    {t(`${w}Cta`)}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <section id="contact" className="mt-16 border-t-2 border-sutra pt-10">
          <BilingualHeading as="h2" {...contactPair} className="text-[2rem] leading-tight" secondaryClassName="text-ink-2" />
          <div className="mt-8 grid gap-10 min-[820px]:grid-cols-2">
            <address className="not-italic">
              <p>{t("org")}</p>
              <p>{t("city")}</p>
              <p className="mt-4">
                <a className={link} href={`mailto:${t("email")}`}>
                  {t("email")}
                </a>
              </p>
              <p className="mt-3">
                <a className={link} href={tel(t("phone1"))}>
                  {t("phone1")}
                </a>
              </p>
              <p className="mt-3">
                <a className={link} href={tel(t("phone2"))}>
                  {t("phone2")}
                </a>
              </p>
              <p className="mt-4 font-sans text-sm text-ink-2">{t("contactNote")}</p>
            </address>
            <div>
              <p className="font-sans text-ink-2">{t("followTitle")}</p>
              <p className="mt-3">
                <a className={link} href="https://www.facebook.com/VrikshabandhanAbhiyan/" rel="noopener" target="_blank">
                  {t("facebook")}
                </a>
              </p>
              <p className="mt-3">{t("blog")}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
