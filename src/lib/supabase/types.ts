import type { MediaItem } from "@/lib/content/types";

export type PostRow = {
  id: string;
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
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostInsert = Omit<PostRow, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string };
