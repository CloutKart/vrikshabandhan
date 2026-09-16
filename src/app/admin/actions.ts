"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireEditor } from "@/lib/supabase/auth";
import { serverClient } from "@/lib/supabase/server";

/** After an editor saves, every public page may show the change. Editors only. */
export async function revalidateStories() {
  await requireEditor();
  revalidatePath("/", "layout");
}

export async function signOut() {
  const sb = await serverClient();
  await sb?.auth.signOut();
  redirect("/admin/login");
}
