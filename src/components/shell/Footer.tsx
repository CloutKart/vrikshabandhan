import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("involve");
  const f = useTranslations("footer");
  const tel = (s: string) => `tel:${s.replace(/\s+/g, "")}`;
  const link = "inline-block py-2 underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-200 ease-enter hover:decoration-sutra focus-visible:decoration-sutra";
  return (
    <footer className="page mt-24 border-t border-moss py-12 font-sans text-sm text-ink-2">
      <div className="grid gap-10 min-[820px]:grid-cols-3">
        <address className="not-italic">
          <p className="text-ink">{t("org")}</p>
          <p>{t("city")}</p>
          <p className="mt-1">
            <a className={link} href={`mailto:${t("email")}`}>
              {t("email")}
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
          <p className="mt-3">
            <a className={link} href="https://www.facebook.com/VrikshabandhanAbhiyan/" rel="noopener" target="_blank">
              {t("facebook")}
            </a>
          </p>
          <p className="mt-2">{t("blog")}</p>
        </div>
        <p className="min-[820px]:text-right">{f("rights")}</p>
      </div>
    </footer>
  );
}
