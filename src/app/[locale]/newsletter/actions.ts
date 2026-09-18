"use server";

import { headers } from "next/headers";
import type { Locale } from "@/i18n/routing";
import { rpcConfirm, rpcSubscribe, rpcUnsubscribe } from "@/lib/newsletter/db";
import { newsletterEnv } from "@/lib/newsletter/env";
import { renderAlreadyMail, renderConfirmMail } from "@/lib/newsletter/render";
import { sendOne } from "@/lib/newsletter/resend";
import { mailStrings } from "@/lib/newsletter/strings";
import type { ConfirmState, SubscribeState, UnsubscribeState } from "@/lib/newsletter/types";
import { cleanLocale, isToken, parseSubscribeInput } from "@/lib/newsletter/validate";
import { publicClient } from "@/lib/supabase/public";

const FROM_NAME = mailStrings("en").brandName;

async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ?? "";
}

/**
 * The subscribe form. Every outcome that involves a known address returns the
 * same "a link is on its way" state, so the form never reveals whether an
 * address is on the list. Confirmation mails go out here; in test mode they
 * go to the owner's inbox with the real address in the subject.
 */
export async function subscribe(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  const pageLocale = cleanLocale(form.get("pageLocale"), "en");
  const input = parseSubscribeInput(form, pageLocale);
  if (!input) return { status: "invalid" };
  if (input.trap) return { status: "sent", email: input.email };
  const env = newsletterEnv();
  if (!env || !publicClient()) return { status: "off" };

  let outcome;
  try {
    outcome = await rpcSubscribe(input.email, input.locale, await clientIp());
  } catch (e) {
    console.error("newsletter: subscribe failed", e instanceof Error ? e.message : e);
    return { status: "failed" };
  }
  if (!outcome) return { status: "off" };
  if (outcome.outcome === "rate_limited") return { status: "rateLimited" };
  if (outcome.outcome === "throttled") return { status: "sent", email: input.email };

  const strings = mailStrings(input.locale);
  const from = `${FROM_NAME} <${env.fromAddress}>`;
  const to = env.testTo ?? input.email;
  const prefix = env.testTo ? `[Test for ${input.email}] ` : "";
  try {
    if (outcome.outcome === "confirm") {
      const confirmUrl = `${env.siteUrl}/${input.locale}/newsletter/confirm?t=${outcome.confirmToken}`;
      const mail = renderConfirmMail(input.locale, { siteUrl: env.siteUrl, strings, confirmUrl, email: input.email });
      await sendOne(env.apiKey, { from, to: [to], subject: `${prefix}${mail.subject}`, html: mail.html, text: mail.text, reply_to: strings.orgEmail }, `confirm-${outcome.subscriberId}-${Date.now()}`);
    } else if (outcome.outcome === "already") {
      const unsubscribeUrl = `${env.siteUrl}/${input.locale}/newsletter/unsubscribe?t=${outcome.unsubscribeToken}`;
      const mail = renderAlreadyMail(input.locale, { siteUrl: env.siteUrl, strings, email: input.email, unsubscribeUrl });
      await sendOne(env.apiKey, { from, to: [to], subject: `${prefix}${mail.subject}`, html: mail.html, text: mail.text, reply_to: strings.orgEmail });
    }
  } catch (e) {
    console.error("newsletter: mail failed", e instanceof Error ? e.message : e);
    return { status: "failed" };
  }
  return { status: "sent", email: input.email };
}

/** The button on the confirmation page. GET never confirms; only this POST does. */
export async function confirm(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const token = form.get("t");
  if (!isToken(token)) return { status: "expired" };
  if (!newsletterEnv() || !publicClient()) return { status: "off" };
  try {
    const r = await rpcConfirm(token);
    if (!r) return { status: "off" };
    if (r.outcome === "confirmed" && r.email) return { status: "confirmed", email: r.email, locale: r.locale as Locale };
    return { status: "expired" };
  } catch (e) {
    console.error("newsletter: confirm failed", e instanceof Error ? e.message : e);
    return { status: "expired" };
  }
}

/** The button on the unsubscribe page. Idempotent. */
export async function unsubscribe(_prev: UnsubscribeState, form: FormData): Promise<UnsubscribeState> {
  const token = form.get("t");
  if (!isToken(token)) return { status: "invalid" };
  if (!newsletterEnv() || !publicClient()) return { status: "off" };
  try {
    const r = await rpcUnsubscribe(token);
    if (!r) return { status: "off" };
    if (r.outcome === "unsubscribed" && r.email) return { status: "unsubscribed", email: r.email };
    return { status: "invalid" };
  } catch (e) {
    console.error("newsletter: unsubscribe failed", e instanceof Error ? e.message : e);
    return { status: "invalid" };
  }
}
