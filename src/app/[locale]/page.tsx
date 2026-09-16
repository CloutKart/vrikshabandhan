import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hero");
  return (
    <main id="content" className="px-6 py-24">
      <h1 className="text-5xl">{t("title")}</h1>
      <p className="mt-6 max-w-prose">{t("lede")}</p>
    </main>
  );
}
