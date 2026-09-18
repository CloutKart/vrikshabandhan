import { plainText } from "@/lib/content/markup";
import type { Block, Inline } from "@/lib/content/types";
import { ytId } from "@/lib/content/youtube";

/**
 * The editor's document (Tiptap's JSON, which is ProseMirror's) to story
 * blocks and back. Pure: no editor instance, no DOM, so it runs in unit
 * tests and is the single place where the two shapes meet. Anything the
 * story format cannot hold is dropped here, so what the writer sees after
 * a paste is exactly what will be saved.
 */
export type DocMark = { type: string; attrs?: Record<string, unknown> };
export type DocNode = { type: string; attrs?: Record<string, unknown>; content?: DocNode[]; text?: string; marks?: DocMark[] };

const same = (a: Inline, b: Inline) => Boolean(a.bold) === Boolean(b.bold) && Boolean(a.italic) === Boolean(b.italic) && (a.href ?? "") === (b.href ?? "");

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

/** The runs inside a text-bearing node: text with bold, italic and link; a hard break is a space. */
function inlinesOf(node: DocNode): Inline[] {
  const runs: Inline[] = [];
  for (const child of node.content ?? []) {
    if (child.type === "text") {
      const r: Inline = { text: child.text ?? "" };
      for (const m of child.marks ?? []) {
        if (m.type === "bold") r.bold = true;
        else if (m.type === "italic") r.italic = true;
        else if (m.type === "link" && typeof m.attrs?.href === "string" && m.attrs.href) r.href = m.attrs.href;
      }
      runs.push(r);
    } else if (child.type === "hardBreak") runs.push({ text: " " });
    else if (child.content) runs.push(...inlinesOf(child));
  }
  return compact(runs);
}

function prose(kind: "heading" | "paragraph", inlines: Inline[]): Block | null {
  const text = plainText(inlines);
  if (!text.trim()) return null;
  return { kind, text, inlines };
}

/** A list item's paragraphs joined into one line; nested lists become further items. */
function listItems(list: DocNode): Inline[][] {
  const items: Inline[][] = [];
  for (const item of list.content ?? []) {
    const own: Inline[] = [];
    const nested: Inline[][] = [];
    for (const child of item.content ?? []) {
      if (child.type === "bulletList" || child.type === "orderedList") nested.push(...listItems(child));
      else {
        const runs = inlinesOf(child);
        if (runs.length) {
          if (own.length) own.push({ text: " " });
          own.push(...runs);
        }
      }
    }
    const line = compact(own);
    if (plainText(line).trim()) items.push(line);
    items.push(...nested);
  }
  return items;
}

export function docToBlocks(doc: DocNode): Block[] {
  const out: Block[] = [];
  for (const node of doc.content ?? []) {
    if (node.type === "heading") {
      const b = prose("heading", inlinesOf(node));
      if (b) out.push(b);
    } else if (node.type === "blockquote") {
      const quotes: Block[] = [];
      let cite = "";
      for (const child of node.content ?? []) {
        if (child.type === "citation") cite = plainText(inlinesOf(child)).trim();
        else {
          const inlines = inlinesOf(child);
          const text = plainText(inlines);
          if (text.trim()) quotes.push({ kind: "quote", text, inlines });
        }
      }
      const last = quotes[quotes.length - 1];
      if (last && last.kind === "quote" && cite) last.cite = cite;
      out.push(...quotes);
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      const items = listItems(node);
      if (items.length) out.push({ kind: "list", ordered: node.type === "orderedList", items });
    } else if (node.type === "storyImage") {
      const path = typeof node.attrs?.path === "string" ? node.attrs.path : "";
      if (path) out.push({ kind: "image", path, caption: typeof node.attrs?.caption === "string" ? node.attrs.caption.trim() : "" });
    } else if (node.type === "storyYoutube") {
      const url = typeof node.attrs?.url === "string" ? node.attrs.url : "";
      const id = ytId(url);
      if (id) out.push({ kind: "youtube", url, id });
    } else if (node.content) {
      // A paragraph, or any block the schema let through: its words as a paragraph.
      const b = prose("paragraph", inlinesOf(node));
      if (b) out.push(b);
    }
  }
  return out;
}

function textNodes(inlines: Inline[]): DocNode[] {
  return inlines.map((r) => {
    const marks: DocMark[] = [];
    if (r.bold) marks.push({ type: "bold" });
    if (r.italic) marks.push({ type: "italic" });
    if (r.href) marks.push({ type: "link", attrs: { href: r.href } });
    const n: DocNode = { type: "text", text: r.text };
    if (marks.length) n.marks = marks;
    return n;
  });
}

function paragraph(inlines: Inline[]): DocNode {
  const content = textNodes(inlines);
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

export function blocksToDoc(blocks: Block[]): DocNode {
  const content: DocNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.kind === "heading") content.push({ type: "heading", attrs: { level: 2 }, content: textNodes(b.inlines) });
    else if (b.kind === "paragraph") content.push(paragraph(b.inlines));
    else if (b.kind === "quote") {
      // Consecutive quotes without a source share one blockquote; a source closes it.
      const inner: DocNode[] = [];
      let j = i;
      while (j < blocks.length) {
        const q = blocks[j];
        if (q.kind !== "quote") break;
        inner.push(paragraph(q.inlines));
        j++;
        if (q.cite) {
          inner.push({ type: "citation", content: [{ type: "text", text: q.cite }] });
          break;
        }
      }
      content.push({ type: "blockquote", content: inner });
      i = j;
      continue;
    } else if (b.kind === "list") {
      content.push({ type: b.ordered ? "orderedList" : "bulletList", content: b.items.map((item) => ({ type: "listItem", content: [paragraph(item)] })) });
    } else if (b.kind === "image") content.push({ type: "storyImage", attrs: { path: b.path, caption: b.caption } });
    else if (b.kind === "youtube") content.push({ type: "storyYoutube", attrs: { url: b.url, id: b.id } });
    i++;
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
