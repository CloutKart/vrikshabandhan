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

/** Mirrors the bucket's limits in supabase/migrations/0003_storage.sql, so a refusal is explained before the upload. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4" };

function contentType(file: File): string | null {
  if (Object.values(TYPES).includes(file.type)) return file.type;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return TYPES[ext] ?? null;
}

/** Why a file cannot be uploaded, or null when it can. */
export function acceptedFile(file: File): string | null {
  if (!contentType(file)) return "only JPG, PNG, WebP and MP4 files can be uploaded.";
  if (file.size > MAX_UPLOAD_BYTES) return `larger than ${Math.round(MAX_UPLOAD_BYTES / 1048576)} MB.`;
  return null;
}

/** Upload one file into posts/<folder>/ and describe it as a media item (alt text still empty). */
export async function uploadMedia(file: File, folder: string): Promise<MediaItem> {
  const sb = browserClient();
  if (!sb) throw new Error("Supabase is not configured.");
  const why = acceptedFile(file);
  if (why) throw new Error(why);
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `posts/${folder || "unsorted"}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: contentType(file) ?? undefined, upsert: false });
  if (error) throw new Error(error.message);
  const type = (contentType(file) ?? "").startsWith("video/") ? "video" : "image";
  const size = type === "image" ? await imageSize(file) : null;
  return { path, type, alt_en: "", alt_hi: "", ...(size ?? {}) };
}
