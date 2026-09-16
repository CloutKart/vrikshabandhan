import { useTranslations } from "next-intl";

/** First focusable element on every page. Visible only while focused. */
export function SkipLink() {
  const t = useTranslations("nav");
  return (
    <a
      href="#content"
      className="sr-only font-sans focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-gold focus:px-4 focus:py-2 focus:text-ground"
    >
      {t("skip")}
    </a>
  );
}
