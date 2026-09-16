import { NotConfigured } from "@/components/admin/NotConfigured";
import { PostList } from "@/components/admin/PostList";
import { requireEditor } from "@/lib/supabase/auth";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { serverClient } from "@/lib/supabase/server";
import type { PostRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Show = "all" | "live" | "draft" | "deleted";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  if (!publicSupabaseEnv()) return <NotConfigured />;
  await requireEditor();
  const sb = await serverClient();
  const { data } = await sb!.from("posts").select("*").order("date", { ascending: false });
  const { show } = await searchParams;
  const s: Show = show === "live" || show === "draft" || show === "deleted" ? show : "all";
  return <PostList posts={(data ?? []) as PostRow[]} show={s} />;
}
