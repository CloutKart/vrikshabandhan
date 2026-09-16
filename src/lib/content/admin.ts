import type { MediaItem } from "./types";

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

export function emptyDraft(): Draft {
  return {
    slug: "",
    title_en: "",
    title_hi: "",
    summary_en: "",
    summary_hi: "",
    body_en: "",
    body_hi: "",
    date: new Date().toISOString().slice(0, 10),
    place: "",
    tags: [],
    yt: "",
    media: [],
    live: false,
  };
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
  if (d.live && d.media.some((m) => m.type === "image" && !m.alt_en.trim()))
    errors.media = "Every photo needs an English description before the post goes live.";
  return errors;
}
