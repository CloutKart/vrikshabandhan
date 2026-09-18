import type { MediaItem } from "./types";
import { parseBody } from "./markup";
import { ytId } from "./youtube";

/** What the editor form holds. Same shape as a row minus the server-managed columns. */
export type Draft = {
  slug: string;
  title_en: string;
  title_hi: string;
  summary_en: string;
  summary_hi: string;
  body_en: string;
  body_hi: string;
  date: string;
  place: string;
  tags: string[];
  yt: string;
  media: MediaItem[];
  live: boolean;
};

export type DraftErrors = Partial<Record<keyof Draft, string>>;

/** Today in the editor's own time zone, as YYYY-MM-DD (the ISO string would be the UTC date). */
export function localDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function emptyDraft(): Draft {
  return {
    slug: "",
    title_en: "",
    title_hi: "",
    summary_en: "",
    summary_hi: "",
    body_en: "",
    body_hi: "",
    date: localDate(),
    place: "",
    tags: [],
    yt: "",
    media: [],
    live: false,
  };
}

/** What a save writes: the draft, and for a deleted post the end of its deletion, so saving brings it back. */
export function savePayload(draft: Draft, deletedAt: string | null): Draft | (Draft & { deleted_at: null }) {
  return deletedAt ? { ...draft, deleted_at: null } : draft;
}

export function parseTags(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (tag && !out.some((t) => t.toLowerCase() === tag.toLowerCase())) out.push(tag);
  }
  return out;
}

/** Field-level errors, empty when the draft can be saved. Alt text is required only to publish. */
export function validateDraft(d: Draft): DraftErrors {
  const errors: DraftErrors = {};
  if (!d.title_en.trim()) errors.title_en = "Give the post an English title.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) errors.date = "Pick a date.";
  if (d.yt.trim() && !ytId(d.yt)) errors.yt = "Paste a youtube.com or youtu.be link to the video.";
  if (d.live && d.media.some((m) => m.type === "image" && !m.alt_en.trim()))
    errors.media = "Every photo needs an English description before the post goes live.";
  if (d.live) {
    for (const field of ["body_en", "body_hi"] as const) {
      if (missingPhotos(d[field], d.media).length) errors[field] = "A photo in the text has been removed from the uploads. Remove it from the text or upload it again.";
    }
  }
  return errors;
}

/** Paths of photos placed in the text that are no longer among the uploads. */
export function missingPhotos(body: string, media: MediaItem[]): string[] {
  const have = new Set(media.filter((m) => m.type === "image").map((m) => m.path));
  return parseBody(body)
    .filter((b) => b.kind === "image" && !have.has(b.path))
    .map((b) => (b.kind === "image" ? b.path : ""));
}
