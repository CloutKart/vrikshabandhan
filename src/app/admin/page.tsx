import { NotConfigured } from "@/components/admin/NotConfigured";
import { PostList } from "@/components/admin/PostList";
import { requireEditor } from "@/lib/supabase/auth";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import type { PostRow } from "@/lib/supabase/types";
import { newsletterEnv } from "@/lib/newsletter/env";

export const dynamic = "force-dynamic";

type Show = "all" | "live" | "draft" | "deleted";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  if (!publicSupabaseEnv()) return <NotConfigured />;
  const { sb } = await requireEditor();
  const { data, error } = await sb.from("posts").select("*").order("date", { ascending: false });
  if (error) throw new Error(`Could not load the posts: ${error.message}`);
  const { show } = await searchParams;
  const s: Show = show === "live" || show === "draft" || show === "deleted" ? show : "all";
  let subscribers: number | null = null;
  if (newsletterEnv()) {
    const { count } = await sb.from("subscribers").select("id", { count: "exact", head: true }).not("confirmed_at", "is", null).is("unsubscribed_at", null);
    subscribers = count ?? 0;
  }
  return <PostList posts={(data ?? []) as PostRow[]} show={s} subscribers={subscribers} />;
}
