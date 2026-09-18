import { notFound } from "next/navigation";
import { NotConfigured } from "@/components/admin/NotConfigured";
import { NewsletterStatus, type DeliverySummary } from "@/components/admin/NewsletterStatus";
import { PostEditor } from "@/components/admin/PostEditor";
import { newsletterEnv } from "@/lib/newsletter/env";
import type { Draft } from "@/lib/content/admin";
import { requireEditor } from "@/lib/supabase/auth";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import type { PostRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
/** A publish may mail a thousand subscribers from this page's actions; give them a minute. */
export const maxDuration = 60;

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!publicSupabaseEnv()) return <NotConfigured />;
  const { sb } = await requireEditor();
  const { id } = await params;
  const { data, error } = await sb.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the post: ${error.message}`);
  if (!data) notFound();
  const row = data as PostRow;
  const initial: Draft = {
    slug: row.slug,
    title_en: row.title_en,
    title_hi: row.title_hi,
    summary_en: row.summary_en,
    summary_hi: row.summary_hi,
    body_en: row.body_en,
    body_hi: row.body_hi,
    date: row.date,
    place: row.place,
    tags: row.tags,
    yt: row.yt,
    media: row.media,
    live: row.live,
  };
  const env = newsletterEnv();
  let count = 0;
  const deliveries: DeliverySummary = { sent: 0, failed: 0, queued: 0, failures: [] };
  if (env) {
    const [{ count: c }, { data: rows }] = await Promise.all([
      sb.from("subscribers").select("id", { count: "exact", head: true }).not("confirmed_at", "is", null).is("unsubscribed_at", null),
      sb.from("newsletter_deliveries").select("status, error, subscribers(email)").eq("post_id", id),
    ]);
    count = c ?? 0;
    for (const d of (rows ?? []) as unknown as Array<{ status: string; error: string | null; subscribers: { email: string } | null }>) {
      if (d.status === "sent") deliveries.sent++;
      else if (d.status === "failed") {
        deliveries.failed++;
        deliveries.failures.push({ email: d.subscribers?.email ?? "(unknown)", error: d.error ?? "unknown error" });
      } else deliveries.queued++;
    }
  }
  const status = <NewsletterStatus postId={row.id} live={row.live && !row.deleted_at} sentAt={row.newsletter_sent_at} test={row.newsletter_test} count={count} deliveries={deliveries} on={Boolean(env)} testTo={env?.testTo ?? null} />;
  return <PostEditor id={row.id} initial={initial} deletedAt={row.deleted_at} above={status} />;
}
