const PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/;

/** The 11-character id from any common YouTube URL shape, or null. */
export function ytId(url: string | undefined | null): string | null {
  if (!url) return null;
  const m = url.match(PATTERN);
  return m ? m[1] : null;
}
