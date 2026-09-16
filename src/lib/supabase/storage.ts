"use client";

import type { MediaItem } from "@/lib/content/types";
import { browserClient } from "./browser";
import { MEDIA_BUCKET } from "./env";

async function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch {
    return null;
  }
}

/** Upload one file into posts/<slug>/ and describe it as a media item (alt text still empty). */
export async function uploadMedia(file: File, slug: string): Promise<MediaItem> {
  const sb = browserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `posts/${slug || "unsorted"}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const type = file.type.startsWith("video/") ? "video" : "image";
  const size = type === "image" ? await imageSize(file) : null;
  return { path, type, alt_en: "", alt_hi: "", ...(size ?? {}) };
}
