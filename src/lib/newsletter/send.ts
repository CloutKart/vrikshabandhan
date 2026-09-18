import type { Locale } from "@/i18n/routing";
import { BATCH_SIZE } from "./constants";
import { fill } from "./html";
import { EMAIL, ONECLICK_URL, UNSUBSCRIBE_URL, buildHeaders } from "./render";
import type { Mail, Recipient, Rendered } from "./types";

/** Recipients in the order given, cut into batches; the composition of each batch is fixed here. */
export function planBatches<T>(items: T[], size = BATCH_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** In test mode every mail goes to the owner: one English and one Hindi edition, with the real count in the subject. */
export function applyTestMode(recipients: Recipient[], testTo: string): { recipients: Recipient[]; prefix: string } {
  const prefix = `[Test, ${recipients.length} subscriber${recipients.length === 1 ? "" : "s"}] `;
  return {
    prefix,
    recipients: (["en", "hi"] as Locale[]).map((locale) => ({ id: `test-${locale}`, email: testTo, locale, unsubscribe_token: "test" })),
  };
}

/** The provider's idempotency key for a batch: the first attempt reuses nothing, a retry of refused rows gets its own. */
export function idempotencyKey(postId: string, batchNo: number, retry = 0): string {
  return retry ? `nl-${postId}-${batchNo}-r${retry}` : `nl-${postId}-${batchNo}`;
}

/** One rendered edition filled in for one recipient. */
export function personalise(edition: Rendered, r: Recipient, opts: { from: string; replyTo: string; siteUrl: string; subjectPrefix?: string }): Mail {
  const unsubscribeUrl = `${opts.siteUrl}/${r.locale}/newsletter/unsubscribe?t=${r.unsubscribe_token}`;
  const oneClickUrl = `${opts.siteUrl}/api/newsletter/unsubscribe?t=${r.unsubscribe_token}&l=${r.locale}`;
  const swap = (s: string) => fill(fill(fill(s, UNSUBSCRIBE_URL, unsubscribeUrl), ONECLICK_URL, oneClickUrl), EMAIL, r.email);
  return {
    from: opts.from,
    to: [r.email],
    reply_to: opts.replyTo,
    subject: `${opts.subjectPrefix ?? ""}${edition.subject}`,
    html: swap(edition.html),
    text: swap(edition.text),
    headers: buildHeaders(oneClickUrl),
  };
}
