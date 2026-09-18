import type { Locale } from "@/i18n/routing";

export type SubscribeStatus = "idle" | "sent" | "invalid" | "rateLimited" | "failed" | "off";
export type SubscribeState = { status: SubscribeStatus; email?: string };

export type ConfirmState = { status: "idle" | "confirmed" | "expired" | "off"; email?: string; locale?: Locale };
export type UnsubscribeState = { status: "idle" | "unsubscribed" | "invalid" | "off"; email?: string };

/** What happened when a story was offered to subscribers. */
export type SendReport = {
  status: "sent" | "partial" | "none" | "already" | "test" | "off" | "not-live" | "error";
  total: number;
  sent: number;
  failed: number;
  reason?: string;
  sentAt?: string;
  testTo?: string;
};

export type Recipient = { id: string; email: string; locale: Locale; unsubscribe_token: string };

/** One e-mail, ready for the provider. */
export type Mail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
  headers?: Record<string, string>;
};

export type Rendered = { subject: string; html: string; text: string };

/** Every string a mail needs, resolved for one language from the message files. */
export type MailStrings = {
  siteName: string;
  brandName: string;
  brandNameOther: string;
  place: string;
  subject: string;
  read: string;
  otherLocale: string;
  morePhotos: string;
  watch: string;
  why: string;
  unsubscribe: string;
  onlyEnglish: string;
  gallery: string;
  rights: string;
  orgEmail: string;
  confirmSubject: string;
  confirmTitle: string;
  confirmText: string;
  confirmCta: string;
  confirmIgnore: string;
  alreadySubject: string;
  alreadyText: string;
};

/** The labels the client-side form and popup receive as props (built server-side from the message files). */
export type NewsletterLabels = {
  askTitle: string;
  askText: string;
  footerTitle: string;
  footerText: string;
  emailLabel: string;
  localeLegend: string;
  localeEn: string;
  localeHi: string;
  submit: string;
  submitting: string;
  notNow: string;
  close: string;
  sent: string;
  invalid: string;
  rateLimited: string;
  unavailable: string;
  failed: string;
  honeypotLabel: string;
};
