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
  /** When the story was mailed to subscribers (once, ever), and whether that send was a test. */
  newsletter_sent_at: string | null;
  newsletter_test: boolean;
};

export type PostInsert = Omit<PostRow, "id" | "created_at" | "updated_at" | "deleted_at" | "newsletter_sent_at" | "newsletter_test"> & {
  id?: string;
  newsletter_sent_at?: string | null;
};

export type SubscriberRow = {
  id: string;
  email: string;
  locale: "en" | "hi";
  unsubscribe_token: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
};

export type DeliveryRow = {
  post_id: string;
  subscriber_id: string;
  batch_no: number;
  locale: "en" | "hi";
  status: "queued" | "sent" | "failed";
  attempts: number;
  provider_id: string | null;
  error: string | null;
  updated_at: string;
};
