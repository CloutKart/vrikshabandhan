import { notFound } from "next/navigation";
import { NotConfigured } from "@/components/admin/NotConfigured";
import { PostEditor } from "@/components/admin/PostEditor";
import type { Draft } from "@/lib/content/admin";
import { requireEditor } from "@/lib/supabase/auth";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import type { PostRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

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
  return <PostEditor id={row.id} initial={initial} deletedAt={row.deleted_at} />;
}
