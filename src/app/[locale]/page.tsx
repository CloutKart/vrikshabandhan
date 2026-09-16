import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero/Hero";
import type { Locale } from "@/i18n/routing";
import "@/components/hero/hero.css";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main id="content" className="pb-24">
      <Hero locale={locale as Locale} />
    </main>
  );
}
