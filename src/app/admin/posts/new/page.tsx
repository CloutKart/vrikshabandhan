import { NotConfigured } from "@/components/admin/NotConfigured";
import { PostEditor } from "@/components/admin/PostEditor";
import { requireEditor } from "@/lib/supabase/auth";
import { publicSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
/** Publishing a new story may mail every subscriber from this page's actions. */
export const maxDuration = 60;

export default async function NewPostPage() {
  if (!publicSupabaseEnv()) return <NotConfigured />;
  await requireEditor();
  return <PostEditor />;
}
