import type { Block } from "./types";

const CITE_SEPARATOR = " — ";

/**
 * The editor's mini-markup, kept from v2 so existing posts need no migration:
 * one paragraph per line, "## " starts a subheading, "> " starts a quote, and
 * a quote may end with " — Name" to give its source.
 */
export function parseBody(body: string | undefined | null): Block[] {
  if (!body) return [];
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): Block => {
      if (line.startsWith("## ")) return { kind: "heading", text: line.slice(3).trim() };
      if (line.startsWith("> ")) {
        const raw = line.slice(2).trim();
        const at = raw.lastIndexOf(CITE_SEPARATOR);
        if (at > 0) return { kind: "quote", text: raw.slice(0, at).trim(), cite: raw.slice(at + CITE_SEPARATOR.length).trim() };
        return { kind: "quote", text: raw };
      }
      return { kind: "paragraph", text: line };
    });
}
