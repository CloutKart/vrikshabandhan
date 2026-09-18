import { describe, expect, it } from "vitest";
import { blocksToDoc, docToBlocks, type DocNode } from "@/lib/editor/doc";
import type { Block, Inline } from "@/lib/content/types";

const plain = (text: string): Inline[] => [{ text }];

const fixtures: Block[] = [
  { kind: "heading", text: "A heading with bold", inlines: [{ text: "A heading with " }, { text: "bold", bold: true }] },
  { kind: "paragraph", text: "Read the letter here.", inlines: [{ text: "Read " }, { text: "the letter", href: "https://x.in/a" }, { text: " here." }] },
  { kind: "quote", text: "Be careful in time.", inlines: plain("Be careful in time."), cite: "Manoj Dhyani" },
  { kind: "quote", text: "No source", inlines: plain("No source") },
  { kind: "list", ordered: false, items: [plain("One"), [{ text: "Two ", italic: true }, { text: "bold", bold: true, italic: true }]] },
  { kind: "list", ordered: true, items: [plain("First"), plain("Second")] },
  { kind: "image", path: "posts/a/b.jpg", caption: "Tying the thread" },
  { kind: "youtube", url: "https://youtu.be/XTmHXvDXcI0", id: "XTmHXvDXcI0" },
  { kind: "paragraph", text: "Last", inlines: plain("Last") },
];

describe("blocksToDoc", () => {
  it("builds the editor's document: headings at level 2, quotes with a citation node, lists, photos and films", () => {
    const doc = blocksToDoc(fixtures);
    expect(doc.type).toBe("doc");
    const types = doc.content!.map((n) => n.type);
    expect(types).toEqual(["heading", "paragraph", "blockquote", "blockquote", "bulletList", "orderedList", "storyImage", "storyYoutube", "paragraph"]);
    expect(doc.content![0].attrs).toEqual({ level: 2 });
    expect(doc.content![0].content).toEqual([{ type: "text", text: "A heading with " }, { type: "text", text: "bold", marks: [{ type: "bold" }] }]);
    expect(doc.content![1].content![1]).toEqual({ type: "text", text: "the letter", marks: [{ type: "link", attrs: { href: "https://x.in/a" } }] });
    expect(doc.content![2].content!.map((n) => n.type)).toEqual(["paragraph", "citation"]);
    expect(doc.content![3].content!.map((n) => n.type)).toEqual(["paragraph"]);
    expect(doc.content![4].content![1].content![0].content).toEqual([
      { type: "text", text: "Two ", marks: [{ type: "italic" }] },
      { type: "text", text: "bold", marks: [{ type: "bold" }, { type: "italic" }] },
    ]);
    expect(doc.content![6].attrs).toEqual({ path: "posts/a/b.jpg", caption: "Tying the thread" });
    expect(doc.content![7].attrs).toEqual({ url: "https://youtu.be/XTmHXvDXcI0", id: "XTmHXvDXcI0" });
  });
  it("gives an empty story one empty paragraph so the editor has somewhere to type", () => {
    expect(blocksToDoc([])).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });
});

describe("docToBlocks", () => {
  it("round-trips every block shape", () => {
    expect(docToBlocks(blocksToDoc(fixtures))).toEqual(fixtures);
  });
  it("drops empty paragraphs, unknown marks and nodes the format cannot hold", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        { type: "paragraph" },
        { type: "paragraph", content: [{ type: "text", text: "  " }] },
        { type: "paragraph", content: [{ type: "text", text: "kept", marks: [{ type: "underline" }, { type: "code" }] }] },
        { type: "horizontalRule" },
        { type: "codeBlock", content: [{ type: "text", text: "code as prose" }] },
      ],
    };
    expect(docToBlocks(doc)).toEqual([
      { kind: "paragraph", text: "kept", inlines: plain("kept") },
      { kind: "paragraph", text: "code as prose", inlines: plain("code as prose") },
    ]);
  });
  it("turns every heading level into a subheading and a hard break into a space", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Big" }] },
        { type: "paragraph", content: [{ type: "text", text: "one" }, { type: "hardBreak" }, { type: "text", text: "two" }] },
      ],
    };
    expect(docToBlocks(doc)).toEqual([
      { kind: "heading", text: "Big", inlines: plain("Big") },
      { kind: "paragraph", text: "one two", inlines: plain("one two") },
    ]);
  });
  it("makes one quote per paragraph inside a blockquote and puts the source on the last", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "First" }] },
            { type: "paragraph", content: [{ type: "text", text: "Second" }] },
            { type: "citation", content: [{ type: "text", text: "Someone" }] },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([
      { kind: "quote", text: "First", inlines: plain("First") },
      { kind: "quote", text: "Second", inlines: plain("Second"), cite: "Someone" },
    ]);
  });
  it("flattens nested lists and joins a list item's paragraphs", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "Outer" }] },
                { type: "paragraph", content: [{ type: "text", text: "more" }] },
                { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Inner" }] }] }] },
              ],
            },
          ],
        },
      ],
    };
    expect(docToBlocks(doc)).toEqual([{ kind: "list", ordered: false, items: [plain("Outer more"), plain("Inner")] }]);
  });
  it("drops a film whose link the id helper rejects and a photo without a path", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        { type: "storyYoutube", attrs: { url: "https://example.org/nope", id: "" } },
        { type: "storyImage", attrs: { path: "", caption: "x" } },
      ],
    };
    expect(docToBlocks(doc)).toEqual([]);
  });
  it("merges adjacent runs with the same marks", () => {
    const doc: DocNode = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "bold" }] }, { type: "text", text: "b", marks: [{ type: "bold" }] }] }] };
    expect(docToBlocks(doc)).toEqual([{ kind: "paragraph", text: "ab", inlines: [{ text: "ab", bold: true }] }]);
  });
});
