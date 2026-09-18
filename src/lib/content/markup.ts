import type { Block, Inline } from "./types";
import { ytId } from "./youtube";

const CITE_SEPARATOR = " — ";

/*
  The story format: one block per line. "## " a subheading, "> " a quote (its
  source after the last " — "), "- " and "1. " list items, "![caption](media:path)"
  a photo, "@youtube(url)" a film, anything else a paragraph. Inside a line
  "**bold**", "_italic_" and "[text](url)"; a backslash escapes the next
  character. The original three line kinds are unchanged, so every older story
  parses as it did. The serializer writes exactly what the parser reads, and
  escapes anything that would otherwise be read as markup.
*/

const IMAGE_LINE = /^!\[(.*)\]\(media:([^)\s]+)\)$/;
const FILM_LINE = /^@youtube\((\S+)\)$/;
const ORDERED_ITEM = /^\d+\.\s+(.*)$/;

/** Characters the serializer escapes anywhere in a run. */
const INLINE_ESCAPES = /[\\*_[\]]/g;
/** Starts of a line that would turn a paragraph into another block. */
const LINE_START = /^(#{1,6}\s|>\s?|-\s|\d+\.\s|!\[|@youtube\()/;

const same = (a: Inline, b: Inline) => Boolean(a.bold) === Boolean(b.bold) && Boolean(a.italic) === Boolean(b.italic) && (a.href ?? "") === (b.href ?? "");

/** Adjacent runs with the same marks become one; empty runs go. */
function compact(runs: Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const last = out[out.length - 1];
    if (last && same(last, r)) last.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

function run(text: string, state: { bold: boolean; italic: boolean; href?: string }): Inline {
  const r: Inline = { text };
  if (state.bold) r.bold = true;
  if (state.italic) r.italic = true;
  if (state.href) r.href = state.href;
  return r;
}

/** Where a link's "](" and ")" sit, honouring escapes, or null when the link is not closed. */
function linkEnd(s: string, from: number): { textEnd: number; urlEnd: number } | null {
  let depth = 0;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      if (depth === 0) {
        if (s[i + 1] !== "(") return null;
        const close = s.indexOf(")", i + 2);
        if (close < 0) return null;
        const url = s.slice(i + 2, close);
        if (!url || /\s/.test(url)) return null;
        return { textEnd: i, urlEnd: close };
      }
      depth--;
    }
  }
  return null;
}

/** Whether a marker at `from` has a closing partner later in the string (outside escapes). */
function closes(s: string, marker: string, from: number): boolean {
  for (let i = from; i < s.length; i++) {
    if (s[i] === "\\") {
      i++;
      continue;
    }
    if (s.startsWith(marker, i)) return true;
  }
  return false;
}

function parseRuns(s: string, href?: string): Inline[] {
  const out: Inline[] = [];
  const state = { bold: false, italic: false, href };
  let buf = "";
  const flush = () => {
    if (buf) out.push(run(buf, state));
    buf = "";
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && i + 1 < s.length) {
      buf += s[i + 1];
      i++;
      continue;
    }
    if (s.startsWith("**", i) && (state.bold || closes(s, "**", i + 2))) {
      flush();
      state.bold = !state.bold;
      i++;
      continue;
    }
    if (c === "_" && (state.italic || closes(s, "_", i + 1))) {
      flush();
      state.italic = !state.italic;
      continue;
    }
    if (c === "[" && !href) {
      const end = linkEnd(s, i + 1);
      if (end) {
        flush();
        const inner = parseRuns(s.slice(i + 1, end.textEnd), s.slice(end.textEnd + 2, end.urlEnd));
        for (const r of inner) {
          if (state.bold) r.bold = true;
          if (state.italic) r.italic = true;
          out.push(r);
        }
        i = end.urlEnd;
        continue;
      }
    }
    buf += c;
  }
  flush();
  return out;
}

/** One line of text into runs with their marks. */
export function parseInline(s: string): Inline[] {
  return compact(parseRuns(s));
}

/** The words alone, marks dropped. */
export function plainText(inlines: Inline[]): string {
  return inlines.map((r) => r.text).join("");
}

function prose(kind: "heading" | "paragraph", text: string): Block {
  const inlines = parseInline(text);
  return { kind, text: plainText(inlines), inlines };
}

export function parseBody(body: string | undefined | null): Block[] {
  if (!body) return [];
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const out: Block[] = [];
  for (const line of lines) {
    const last = out[out.length - 1];
    if (line.startsWith("- ")) {
      const item = parseInline(line.slice(2).trim());
      if (last?.kind === "list" && !last.ordered) last.items.push(item);
      else out.push({ kind: "list", ordered: false, items: [item] });
      continue;
    }
    const ordered = line.match(ORDERED_ITEM);
    if (ordered) {
      const item = parseInline(ordered[1].trim());
      if (last?.kind === "list" && last.ordered) last.items.push(item);
      else out.push({ kind: "list", ordered: true, items: [item] });
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(prose("heading", line.slice(3).trim()));
      continue;
    }
    if (line.startsWith("> ")) {
      const raw = line.slice(2).trim();
      const at = raw.lastIndexOf(CITE_SEPARATOR);
      const text = at > 0 ? raw.slice(0, at).trim() : raw;
      const inlines = parseInline(text);
      const block: Block = { kind: "quote", text: plainText(inlines), inlines };
      if (at > 0) block.cite = raw.slice(at + CITE_SEPARATOR.length).trim();
      out.push(block);
      continue;
    }
    const image = line.match(IMAGE_LINE);
    if (image) {
      out.push({ kind: "image", path: image[2], caption: unescape(image[1]) });
      continue;
    }
    const film = line.match(FILM_LINE);
    if (film) {
      const id = ytId(film[1]);
      if (id) {
        out.push({ kind: "youtube", url: film[1], id });
        continue;
      }
    }
    out.push(prose("paragraph", line));
  }
  return out;
}

function unescape(s: string): string {
  return s.replace(/\\(.)/g, "$1");
}

function escapeRun(text: string): string {
  return text.replace(INLINE_ESCAPES, (c) => `\\${c}`);
}

/** A line's runs back to text: marks open and close where they change, links wrap their runs. */
export function serializeInline(inlines: Inline[]): string {
  const runs = compact(inlines);
  let out = "";
  let bold = false;
  let italic = false;
  let href: string | undefined;
  const close = () => {
    if (italic) out += "_";
    if (bold) out += "**";
    bold = italic = false;
  };
  for (const r of runs) {
    const nextHref = r.href || undefined;
    if (nextHref !== href) {
      close();
      if (href) out += `](${href})`;
      href = nextHref;
      if (href) out += "[";
    }
    const wantBold = Boolean(r.bold);
    const wantItalic = Boolean(r.italic);
    if (wantBold !== bold || wantItalic !== italic) {
      close();
      if (wantBold) out += "**";
      if (wantItalic) out += "_";
      bold = wantBold;
      italic = wantItalic;
    }
    out += escapeRun(r.text);
  }
  close();
  if (href) out += `](${href})`;
  return out;
}

/** A paragraph's first characters must not read as another block. */
function guardLineStart(s: string): string {
  return LINE_START.test(s) ? `\\${s}` : s;
}

export function serializeBody(blocks: Block[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    if (b.kind === "heading") lines.push(`## ${serializeInline(b.inlines)}`);
    else if (b.kind === "quote") lines.push(`> ${serializeInline(b.inlines)}${b.cite ? `${CITE_SEPARATOR}${b.cite}` : ""}`);
    else if (b.kind === "list") for (const [i, item] of b.items.entries()) lines.push(`${b.ordered ? `${i + 1}.` : "-"} ${serializeInline(item)}`);
    else if (b.kind === "image") lines.push(`![${b.caption.replace(/[\\\]]/g, (c) => `\\${c}`)}](media:${b.path})`);
    else if (b.kind === "youtube") lines.push(`@youtube(${b.url})`);
    else lines.push(guardLineStart(serializeInline(b.inlines)));
  }
  return lines.join("\n");
}
