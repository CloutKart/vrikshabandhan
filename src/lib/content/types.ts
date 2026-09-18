import type { Locale } from "@/i18n/routing";

export type MediaItem = {
  path: string;
  type: "image" | "video";
  alt_en: string;
  alt_hi: string;
  width?: number;
  height?: number;
  /** Set for built-in media served from /public; storage items resolve through mediaUrl(). */
  url?: string;
};

export type Post = {
  id: string;
  slug: string;
  title_en: string;
  title_hi: string;
  summary_en: string;
  summary_hi: string;
  body_en: string;
  body_hi: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  place: string;
  tags: string[];
  yt: string;
  media: MediaItem[];
  live: boolean;
  deleted_at?: string | null;
};

/** One run of a line's text with its marks. */
export type Inline = { text: string; bold?: boolean; italic?: boolean; href?: string };

/** A block of story text; `text` is the plain words of a prose block, `inlines` the same words with marks. */
export type Block =
  | { kind: "heading"; text: string; inlines: Inline[] }
  | { kind: "paragraph"; text: string; inlines: Inline[] }
  | { kind: "quote"; text: string; inlines: Inline[]; cite?: string }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "image"; path: string; caption: string }
  | { kind: "youtube"; url: string; id: string };

export type LocalisedField = "title" | "summary" | "body";
export type Picked = { text: string; lang: Locale };
