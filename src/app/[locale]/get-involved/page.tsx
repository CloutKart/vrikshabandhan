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
  const [pair, contactPair] = await Promise.all([bilingual(locale, "involve", "title"), bilingual(locale, "involve", "letterTitle")]);
  const tel = (s: string) => `tel:${s.replace(/\s+/g, "")}`;
  const mail = (subject: string) => `mailto:${t("email")}?subject=${encodeURIComponent(subject)}`;
  const link = "u-thread";

  return (
    <main id="content" className="pb-12">
      <PageHeader pair={pair} lede={t("lede")} />
      <div className="page">
        <ol className="grid gap-12 min-[1024px]:grid-cols-3 min-[1024px]:gap-10">
          {ways.map((w) => (
            <li key={w} className="flex flex-col">
              <hr className="thread-rule" />
              <h2 className="mt-6 text-[2rem] leading-tight">{t(`${w}Title`)}</h2>
              <p className="mt-4 max-w-[44ch] flex-1 text-ink-2">{t(`${w}Text`)}</p>
              <div className="mt-8">
                <Button href={mail(t(`${w}Subject`))} variant={w === "adopt" ? "solid" : "line"}>
                  {t(`${w}Cta`)}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <section id="contact" className="page section" aria-labelledby="contact-title">
        <div data-letter className="paper mx-auto max-w-[60rem] rounded-[var(--radius-panel)]">
          <div className="border-b-2 border-sutra pb-6">
            <BilingualHeading as="h2" {...contactPair} className="text-[clamp(2rem,3vw,2.75rem)] leading-tight" secondaryClassName="text-paper-ink-2" />
          </div>
          <div className="mt-8 grid gap-10 min-[820px]:grid-cols-2">
            <address className="not-italic">
              <p>{t("org")}</p>
              <p>{t("city")}</p>
              <p className="mt-6">
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
              <p className="mt-6 font-sans text-sm text-paper-ink-2">{t("contactNote")}</p>
            </address>
            <div>
              <p className="font-sans text-paper-ink-2">{t("followTitle")}</p>
              <p className="mt-3">
                <a className={link} href="https://www.facebook.com/VrikshabandhanAbhiyan/" rel="noopener" target="_blank">
                  {t("facebook")}
                </a>
              </p>
              <p className="mt-3">{t("blog")}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
