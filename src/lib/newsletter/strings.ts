import en from "../../../messages/en.json";
import hi from "../../../messages/hi.json";
import type { Locale } from "@/i18n/routing";
import type { MailStrings, NewsletterLabels } from "./types";

type Messages = typeof en;

function messages(locale: Locale): Messages {
  return locale === "hi" ? (hi as Messages) : en;
}

/** Every string a mail needs, read straight from the message files (no request context, and what the tests use). */
export function mailStrings(locale: Locale): MailStrings {
  const m = messages(locale);
  const other = messages(locale === "hi" ? "en" : "hi");
  const n = m.newsletter;
  return {
    siteName: m.meta.title,
    brandName: m.brand.name,
    brandNameOther: other.brand.name,
    place: m.brand.place,
    subject: n.mailSubject,
    read: n.mailRead,
    otherLocale: n.mailOtherLocale,
    morePhotos: n.mailMorePhotos,
    watch: n.mailWatch,
    why: n.mailWhy,
    unsubscribe: n.mailUnsubscribe,
    onlyEnglish: m.stories.onlyEnglish,
    gallery: m.stories.gallery,
    rights: m.footer.rights,
    orgEmail: m.involve.email,
    confirmSubject: n.mailConfirmSubject,
    confirmTitle: n.mailConfirmTitle,
    confirmText: n.mailConfirmText,
    confirmCta: n.mailConfirmCta,
    confirmIgnore: n.mailConfirmIgnore,
    alreadySubject: n.mailAlreadySubject,
    alreadyText: n.mailAlreadyText,
  };
}

/** The labels the client form and popup receive as props. */
export function newsletterLabels(t: (key: string) => string): NewsletterLabels {
  return {
    askTitle: t("askTitle"),
    askText: t("askText"),
    footerTitle: t("footerTitle"),
    footerText: t("footerText"),
    emailLabel: t("emailLabel"),
    localeLegend: t("localeLegend"),
    localeEn: t("localeEn"),
    localeHi: t("localeHi"),
    submit: t("submit"),
    submitting: t("submitting"),
    notNow: t("notNow"),
    close: t("close"),
    sent: t("sent"),
    invalid: t("invalid"),
    rateLimited: t("rateLimited"),
    unavailable: t("unavailable"),
    failed: t("failed"),
    honeypotLabel: t("honeypotLabel"),
  };
}
