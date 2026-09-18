import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { SkipLink } from "@/components/shell/SkipLink";
import { mukta, muktaDevanagari, tiro, tiroItalic } from "@/lib/fonts";
import { DEFAULT_THEME, THEME_COLORS } from "@/lib/theme/constants";
import { THEME_HEAD_SCRIPT } from "@/lib/theme/head-script";
import { JsonLd } from "@/components/seo/JsonLd";
import { OG_IMAGE, ogLocale } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import "@/styles/globals.css";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("title"), template: `%s | ${t("title")}` },
    description: t("description"),
    openGraph: { type: "website", siteName: t("title"), locale: ogLocale(locale as Locale), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image" },
  };
}

/** The Abhiyan as an organisation, for search engines: both names, the address, the contacts, the social pages. */
async function organisation(locale: Locale) {
  const [b, en, hi, i] = await Promise.all([
    getTranslations({ locale, namespace: "brand" }),
    getTranslations({ locale: "en", namespace: "brand" }),
    getTranslations({ locale: "hi", namespace: "brand" }),
    getTranslations({ locale, namespace: "involve" }),
  ]);
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: b("name"),
    alternateName: [en("name"), hi("name")].filter((n) => n !== b("name")),
    url: base,
    logo: `${base}/images/logo.png`,
    image: `${base}${OG_IMAGE.url}`,
    email: i("email"),
    address: { "@type": "PostalAddress", addressLocality: "Dehradun", addressRegion: "Uttarakhand", addressCountry: "IN" },
    foundingDate: "2005",
    sameAs: [i("facebookUrl"), i("youtubeUrl"), i("instagramUrl")],
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Only the nav namespace is read by client components (LocaleSwitch, ThemeToggle);
  // sending the whole catalogue would inline every page's copy a second time.
  const { nav } = await getMessages();
  const org = await organisation(locale as Locale);

  return (
    <html
      lang={locale}
      data-theme={DEFAULT_THEME}
      className={`${tiro.variable} ${tiroItalic.variable} ${mukta.variable} ${muktaDevanagari.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={THEME_COLORS[DEFAULT_THEME]} />
        <script dangerouslySetInnerHTML={{ __html: THEME_HEAD_SCRIPT }} />
        <JsonLd data={org} />
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider messages={{ nav }}>
          <SkipLink />
          <Header />
          {children}
          <Footer />
          <MotionRoot />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
