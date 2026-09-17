import { useLocale, useTranslations } from "next-intl";
import { otherLocale, type Locale } from "@/i18n/routing";
import { Mark } from "./Wordmark";

export function Footer() {
  const locale = useLocale() as Locale;
  const t = useTranslations("involve");
  const f = useTranslations("footer");
  const b = useTranslations("brand");
  const tel = (s: string) => `tel:${s.replace(/\s+/g, "")}`;
  const link =
    "inline-block py-2 underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-200 ease-enter hover:decoration-sutra focus-visible:decoration-sutra";
  const other = otherLocale(locale);
  const otherName = other === "hi" ? "वृक्षबंधन अभियान" : "Vrikshabandhan Abhiyan";
  return (
    <footer className="page mt-[var(--section)] pb-12 font-sans text-sm text-ink-2">
      <hr className="rule" />
      <div className="mt-10 grid gap-10 max-[819px]:mt-8 max-[819px]:gap-8 min-[820px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="flex items-start gap-4">
            <Mark size={64} />
            <div>
              <p className="font-serif text-[clamp(1.6rem,2.4vw,2.5rem)] leading-tight text-ink min-[820px]:whitespace-nowrap">{b("name")}</p>
              <p lang={other} className="font-serif text-xl text-ink-2">
                {otherName}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-[40ch]">{t("org")}, {t("city")}</p>
        </div>
        <address className="not-italic">
          <p className="text-ink">{t("contactTitle")}</p>
          <p className="mt-1">
            <a className={link} href={`mailto:${t("email")}`}>
              {t("email")}
            </a>
          </p>
          <p>
            <a className={link} href={`mailto:${t("email2")}`}>
              {t("email2")}
            </a>
          </p>
          <p>
            <a className={link} href={tel(t("phone1"))}>
              {t("phone1")}
            </a>
          </p>
          <p>
            <a className={link} href={tel(t("phone2"))}>
              {t("phone2")}
            </a>
          </p>
        </address>
        <div>
          <p className="text-ink">{t("followTitle")}</p>
          <p className="mt-1">
            <a className={link} href={t("facebookUrl")} rel="noopener" target="_blank">
              {t("facebook")}
            </a>
          </p>
          <p>
            <a className={link} href={t("youtubeUrl")} rel="noopener" target="_blank">
              {t("youtube")}
            </a>
          </p>
          <p>
            <a className={link} href={t("instagramUrl")} rel="noopener" target="_blank">
              {t("instagram")}
            </a>
          </p>
          <p className="mt-2">{t("blog")}</p>
          <p className="mt-6">{f("rights")}</p>
        </div>
      </div>
    </footer>
  );
}
