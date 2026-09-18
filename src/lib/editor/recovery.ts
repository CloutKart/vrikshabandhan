import type { Draft } from "@/lib/content/admin";

/**
 * A copy of unsaved work, kept in the browser so a closed tab or a dropped
 * connection loses nothing. Pure decisions here; the editor calls them with
 * window.localStorage. Nothing ever leaves the device.
 */
export type DraftCopy = { savedAt: string; draft: Draft };

type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };

export const copyKey = (id?: string | null) => `va-draft-${id ?? "new"}`;

const FIELDS: Array<keyof Draft> = ["slug", "title_en", "title_hi", "summary_en", "summary_hi", "body_en", "body_hi", "date", "place", "tags", "yt", "media", "live"];

export function sameDraft(a: Draft, b: Draft): boolean {
  return FIELDS.every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));
}

export function readCopy(store: Store, key: string): DraftCopy | null {
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftCopy>;
    if (typeof parsed.savedAt !== "string" || !parsed.draft || typeof parsed.draft !== "object") return null;
    return { savedAt: parsed.savedAt, draft: parsed.draft as Draft };
  } catch {
    return null;
  }
}

export function writeCopy(store: Store, key: string, draft: Draft, now = new Date()): void {
  try {
    store.setItem(key, JSON.stringify({ savedAt: now.toISOString(), draft }));
  } catch {
    // Private windows and full storage: the copy is a convenience, never a requirement.
  }
}

export function clearCopy(store: Store, key: string): void {
  try {
    store.removeItem(key);
  } catch {
    // As above.
  }
}

/**
 * Offer a copy only when it holds something the page does not: it differs from
 * the row as loaded, and it is newer than the row's last save (a copy left over
 * from before someone else's save, or before this device's own, is stale).
 */
export function shouldOffer(copy: DraftCopy | null, initial: Draft, rowUpdatedAt?: string | null): boolean {
  if (!copy) return false;
  if (sameDraft(copy.draft, initial)) return false;
  if (rowUpdatedAt && Date.parse(copy.savedAt) <= Date.parse(rowUpdatedAt)) return false;
  return true;
}
