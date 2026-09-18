"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { retryFailed, sendPreview, sendStory } from "@/lib/newsletter/dispatch";
import { newsletterEnv } from "@/lib/newsletter/env";
import type { SendReport } from "@/lib/newsletter/types";
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

const OFF: SendReport = { status: "off", total: 0, sent: 0, failed: 0 };

/**
 * Offer a story to the subscribers. Called after every save of a live post;
 * the database decides whether this is the first publish (send), a re-save
 * (nothing), or a promotion of a test-mode send (`fromTest`).
 */
export async function sendStoryNewsletter(postId: string, opts: { fromTest?: boolean } = {}): Promise<SendReport> {
  const { sb } = await requireEditor();
  const env = newsletterEnv();
  if (!env) return OFF;
  if (opts.fromTest && env.testTo) return { ...OFF, status: "error", reason: "test mode is still on (NEWSLETTER_TEST_TO is set)" };
  return sendStory(sb, env, postId, opts);
}

/** Send again to the subscribers a story could not reach. */
export async function retryFailedDeliveries(postId: string): Promise<SendReport> {
  const { sb } = await requireEditor();
  const env = newsletterEnv();
  if (!env) return OFF;
  return retryFailed(sb, env, postId);
}

/** Both editions of a story to the signed-in editor's own inbox. */
export async function sendNewsletterPreview(postId: string): Promise<SendReport> {
  const { sb, email } = await requireEditor();
  const env = newsletterEnv();
  if (!env) return OFF;
  return sendPreview(sb, env, postId, email);
}
