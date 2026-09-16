import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main id="content" className="page py-24">
      <h1 className="text-4xl">{t("title")}</h1>
      <p className="mt-4">{t("text")}</p>
    </main>
  );
}
