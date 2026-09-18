import { siteUrl } from "@/lib/site";

export type NewsletterEnv = {
  apiKey: string;
  secret: string;
  /** The bare sending address; the display name is always the Abhiyan's. */
  fromAddress: string;
  siteUrl: string;
  /** While set, every mail goes only here (the owner's inbox) and sends are recorded as tests. */
  testTo: string | null;
};

let warned = false;

/** The newsletter's settings, or null when any is missing (the feature is then off, never broken). */
export function newsletterEnv(): NewsletterEnv | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const secret = process.env.NEWSLETTER_SECRET?.trim();
  const fromAddress = process.env.NEWSLETTER_FROM?.trim();
  const testTo = process.env.NEWSLETTER_TEST_TO?.trim() || null;
  const present = [apiKey, secret, fromAddress].filter(Boolean).length;
  if (present === 0) return null;
  if (!apiKey || !secret || !fromAddress) {
    if (!warned) {
      warned = true;
      console.warn("newsletter: RESEND_API_KEY, NEWSLETTER_SECRET and NEWSLETTER_FROM must all be set; the newsletter is off");
    }
    return null;
  }
  return { apiKey, secret, fromAddress, siteUrl: siteUrl(), testTo };
}
