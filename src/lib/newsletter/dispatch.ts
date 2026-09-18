import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/routing";
import { fromRow } from "@/lib/content/posts";
import type { PostRow } from "@/lib/supabase/types";
import { BATCH_PAUSE_MS } from "./constants";
import type { NewsletterEnv } from "./env";
import { renderStoryMail } from "./render";
import { ResendError, sendBatch, sendOne } from "./resend";
import { applyTestMode, idempotencyKey, personalise, planBatches } from "./send";
import { mailStrings } from "./strings";
import type { Mail, Recipient, Rendered, SendReport } from "./types";

/**
 * Sending a story to its subscribers, under the editor's own database session
 * (row-level security decides what it may touch). The claim on the post row is
 * the idempotency key: a story is mailed once, whatever races.
 */
const FROM_NAME = "Vrikshabandhan Abhiyan";

type Editions = Record<Locale, Rendered>;
type DeliveryInsert = { post_id: string; subscriber_id: string; batch_no: number; locale: Locale; status: "queued" | "sent" | "failed"; attempts: number; provider_id?: string | null; error?: string | null };

function editionsFor(row: PostRow, env: NewsletterEnv): Editions {
  const post = fromRow(row);
  return {
    en: renderStoryMail(post, "en", { siteUrl: env.siteUrl, strings: mailStrings("en") }),
    hi: renderStoryMail(post, "hi", { siteUrl: env.siteUrl, strings: mailStrings("hi") }),
  };
}

function mailFor(editions: Editions, r: Recipient, env: NewsletterEnv, subjectPrefix = ""): Mail {
  return personalise(editions[r.locale], r, { from: `${FROM_NAME} <${env.fromAddress}>`, replyTo: mailStrings(r.locale).orgEmail, siteUrl: env.siteUrl, subjectPrefix });
}

async function confirmedRecipients(sb: SupabaseClient): Promise<Recipient[]> {
  const { data, error } = await sb.from("subscribers").select("id, email, locale, unsubscribe_token").not("confirmed_at", "is", null).is("unsubscribed_at", null).order("id");
  if (error) throw new Error(`could not read the subscribers: ${error.message}`);
  return (data ?? []) as Recipient[];
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** One batch: the batch endpoint first; if it refuses the shape, one mail at a time. Returns per-recipient outcomes. */
async function deliverBatch(env: NewsletterEnv, postId: string, batchNo: number, mails: Mail[], recipients: Recipient[], retry: number): Promise<Array<{ ok: true; id: string } | { ok: false; error: string }>> {
  try {
    const ids = await sendBatch(env.apiKey, mails, idempotencyKey(postId, batchNo, retry));
    return mails.map((_, i) => ({ ok: true as const, id: ids[i] ?? "" }));
  } catch (e) {
    if (e instanceof ResendError && e.retryable) return mails.map(() => ({ ok: false as const, error: e.message }));
    // A refusal of the whole request (payload shape, an address the provider rejects): try each mail alone.
    const out: Array<{ ok: true; id: string } | { ok: false; error: string }> = [];
    for (let i = 0; i < mails.length; i++) {
      try {
        out.push({ ok: true, id: await sendOne(env.apiKey, mails[i], `nl-${postId}-${recipients[i].id}${retry ? `-r${retry}` : ""}`) });
      } catch (err) {
        out.push({ ok: false, error: errorText(err) });
      }
      if (i < mails.length - 1) await pause(BATCH_PAUSE_MS);
    }
    return out;
  }
}

async function recordDeliveries(sb: SupabaseClient, rows: DeliveryInsert[]) {
  if (!rows.length) return;
  const { error } = await sb.from("newsletter_deliveries").upsert(rows, { onConflict: "post_id,subscriber_id" });
  if (error) console.error("newsletter: could not record deliveries", error.message);
}

/** Mail a story once. `fromTest` promotes a story that was only test-mailed to a real send. */
export async function sendStory(sb: SupabaseClient, env: NewsletterEnv, postId: string, opts: { fromTest?: boolean } = {}): Promise<SendReport> {
  const none = { total: 0, sent: 0, failed: 0 };
  // The claim: one row, one transition, whatever two tabs or a double click do.
  let claim = sb
    .from("posts")
    .update({ newsletter_sent_at: new Date().toISOString(), newsletter_test: Boolean(env.testTo) })
    .eq("id", postId)
    .eq("live", true)
    .is("deleted_at", null);
  claim = opts.fromTest ? claim.eq("newsletter_test", true) : claim.is("newsletter_sent_at", null);
  const { data: claimed, error: claimError } = await claim.select("*").maybeSingle();
  if (claimError) return { ...none, status: "error", reason: claimError.message };
  if (!claimed) {
    const { data: row } = await sb.from("posts").select("live, deleted_at, newsletter_sent_at").eq("id", postId).maybeSingle();
    if (!row || !row.live || row.deleted_at) return { ...none, status: "not-live" };
    return { ...none, status: "already", sentAt: row.newsletter_sent_at ?? undefined };
  }
  const row = claimed as PostRow;

  let recipients: Recipient[];
  try {
    recipients = await confirmedRecipients(sb);
  } catch (e) {
    return { ...none, status: "error", reason: errorText(e) };
  }
  const editions = editionsFor(row, env);

  if (env.testTo) {
    const test = applyTestMode(recipients, env.testTo);
    try {
      for (const r of test.recipients) await sendOne(env.apiKey, mailFor(editions, r, env, test.prefix));
    } catch (e) {
      return { ...none, status: "error", total: recipients.length, reason: errorText(e) };
    }
    return { ...none, status: "test", total: recipients.length, testTo: env.testTo };
  }
  if (!recipients.length) return { ...none, status: "none" };

  const batches = planBatches(recipients);
  await recordDeliveries(
    sb,
    batches.flatMap((b, batchNo) => b.map((r) => ({ post_id: postId, subscriber_id: r.id, batch_no: batchNo, locale: r.locale, status: "queued" as const, attempts: 0 }))),
  );
  let sent = 0;
  let failed = 0;
  let reason: string | undefined;
  for (let batchNo = 0; batchNo < batches.length; batchNo++) {
    const batch = batches[batchNo];
    const results = await deliverBatch(env, postId, batchNo, batch.map((r) => mailFor(editions, r, env)), batch, 0);
    await recordDeliveries(
      sb,
      batch.map((r, i) => {
        const res = results[i];
        if (res.ok) sent++;
        else {
          failed++;
          reason ??= res.error;
        }
        return { post_id: postId, subscriber_id: r.id, batch_no: batchNo, locale: r.locale, status: res.ok ? ("sent" as const) : ("failed" as const), attempts: 1, provider_id: res.ok ? res.id : null, error: res.ok ? null : res.error };
      }),
    );
    if (batchNo < batches.length - 1) await pause(BATCH_PAUSE_MS);
  }
  return { status: failed ? "partial" : "sent", total: recipients.length, sent, failed, reason };
}

/** Send again to the rows that failed or were left in doubt, one mail each, never to a row already sent. */
export async function retryFailed(sb: SupabaseClient, env: NewsletterEnv, postId: string): Promise<SendReport> {
  const none = { total: 0, sent: 0, failed: 0 };
  const { data: post, error: postError } = await sb.from("posts").select("*").eq("id", postId).maybeSingle();
  if (postError || !post) return { ...none, status: "error", reason: postError?.message ?? "the post was not found" };
  const { data, error } = await sb
    .from("newsletter_deliveries")
    .select("subscriber_id, batch_no, attempts, status, subscribers(id, email, locale, unsubscribe_token, confirmed_at, unsubscribed_at)")
    .eq("post_id", postId)
    .in("status", ["failed", "queued"]);
  if (error) return { ...none, status: "error", reason: error.message };
  type Row = { subscriber_id: string; batch_no: number; attempts: number; status: string; subscribers: { id: string; email: string; locale: Locale; unsubscribe_token: string; confirmed_at: string | null; unsubscribed_at: string | null } | null };
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.subscribers && r.subscribers.confirmed_at && !r.subscribers.unsubscribed_at);
  if (!rows.length) return { ...none, status: "none" };
  const editions = editionsFor(post as PostRow, env);
  let sent = 0;
  let failed = 0;
  let reason: string | undefined;
  const updates: DeliveryInsert[] = [];
  for (const r of rows) {
    const s = r.subscribers!;
    const recipient: Recipient = { id: s.id, email: s.email, locale: s.locale, unsubscribe_token: s.unsubscribe_token };
    const attempt = r.attempts + 1;
    try {
      const id = await sendOne(env.apiKey, mailFor(editions, recipient, env), `nl-${postId}-${s.id}-r${attempt}`);
      sent++;
      updates.push({ post_id: postId, subscriber_id: s.id, batch_no: r.batch_no, locale: s.locale, status: "sent", attempts: attempt, provider_id: id, error: null });
    } catch (e) {
      failed++;
      reason ??= errorText(e);
      updates.push({ post_id: postId, subscriber_id: s.id, batch_no: r.batch_no, locale: s.locale, status: "failed", attempts: attempt, error: errorText(e) });
    }
    await pause(BATCH_PAUSE_MS);
  }
  await recordDeliveries(sb, updates);
  return { status: failed ? "partial" : "sent", total: rows.length, sent, failed, reason };
}

/** Both editions to the signed-in editor, marked as a preview; no claim, no deliveries. */
export async function sendPreview(sb: SupabaseClient, env: NewsletterEnv, postId: string, editor: string): Promise<SendReport> {
  const none = { total: 0, sent: 0, failed: 0 };
  if (env.testTo && env.testTo.toLowerCase() !== editor.toLowerCase()) return { ...none, status: "error", reason: `in test mode the mail service delivers only to ${env.testTo}` };
  const { data: post, error } = await sb.from("posts").select("*").eq("id", postId).maybeSingle();
  if (error || !post) return { ...none, status: "error", reason: error?.message ?? "the post was not found" };
  const editions = editionsFor(post as PostRow, env);
  try {
    for (const locale of ["en", "hi"] as Locale[]) {
      const r: Recipient = { id: `preview-${locale}`, email: editor, locale, unsubscribe_token: "preview" };
      await sendOne(env.apiKey, mailFor(editions, r, env, "[Preview] "));
    }
  } catch (e) {
    return { ...none, status: "error", reason: errorText(e) };
  }
  return { ...none, status: "sent", sent: 2, total: 2 };
}
