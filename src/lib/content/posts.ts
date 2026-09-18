import type { Locale } from "@/i18n/routing";
import { publicClient } from "@/lib/supabase/public";
import { storagePublicUrl } from "@/lib/supabase/env";
import type { PostRow } from "@/lib/supabase/types";
import { builtinPosts } from "./builtin";
import type { LocalisedField, MediaItem, Picked, Post } from "./types";

/** Database copies win over built-in copies of the same slug; newest first. */
export function mergePosts(db: Post[], builtin: Post[]): Post[] {
  const seen = new Set(db.map((p) => p.slug));
  return [...db, ...builtin.filter((p) => !seen.has(p.slug))].sort((a, b) => b.date.localeCompare(a.date));
}

/** The field in the requested language, or English with lang "en" so the markup can say so. */
export function pick(post: Post, field: LocalisedField, locale: Locale): Picked {
  const hi = post[`${field}_hi`];
  if (locale === "hi" && hi) return { text: hi, lang: "hi" };
  return { text: post[`${field}_en`], lang: "en" };
}

export function mediaUrl(m: MediaItem): string {
  return m.url ?? storagePublicUrl(m.path) ?? `/${m.path}`;
}

export function fromRow(r: PostRow): Post {
  return {
    id: r.id,
    slug: r.slug,
    title_en: r.title_en,
    title_hi: r.title_hi ?? "",
    summary_en: r.summary_en ?? "",
    summary_hi: r.summary_hi ?? "",
    body_en: r.body_en ?? "",
    body_hi: r.body_hi ?? "",
    date: r.date,
    place: r.place ?? "",
    tags: r.tags ?? [],
    yt: r.yt ?? "",
    media: r.media ?? [],
    live: r.live,
    deleted_at: r.deleted_at,
  };
}

async function dbPosts(): Promise<Post[]> {
  const client = publicClient();
  if (!client) return [];
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("live", true)
    .is("deleted_at", null)
    .order("date", { ascending: false });
  if (error) {
    console.warn("posts: database read failed, serving built-in posts only", error.message);
    return [];
  }
  return (data as PostRow[]).map(fromRow);
}

export async function getPosts(options: { tag?: string; limit?: number } = {}): Promise<Post[]> {
  let posts = mergePosts(await dbPosts(), builtinPosts).filter((p) => p.live && !p.deleted_at);
  if (options.tag) posts = posts.filter((p) => p.tags.includes(options.tag as string));
  if (options.limit) posts = posts.slice(0, options.limit);
  return posts;
}

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null;
}

export async function getTags(): Promise<string[]> {
  const tags = new Set<string>();
  for (const p of await getPosts()) p.tags.forEach((t) => tags.add(t));
  return [...tags];
}
