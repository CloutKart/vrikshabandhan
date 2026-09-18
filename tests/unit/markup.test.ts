import { describe, expect, it } from "vitest";
import { parseBody, parseInline, plainText, serializeBody, serializeInline } from "@/lib/content/markup";
import type { Block, Inline } from "@/lib/content/types";
import { builtinPosts } from "@/lib/content/builtin";

const plain = (text: string): Inline[] => [{ text }];

describe("parseBody, the three original line kinds", () => {
  it("turns '## ' lines into headings", () => {
    expect(parseBody("## Ten years of warnings")).toEqual([{ kind: "heading", text: "Ten years of warnings", inlines: plain("Ten years of warnings") }]);
  });
  it("turns '> ' lines into quotes and splits a trailing citation", () => {
    expect(parseBody("> Be careful in time. — Manoj Dhyani")).toEqual([
      { kind: "quote", text: "Be careful in time.", inlines: plain("Be careful in time."), cite: "Manoj Dhyani" },
    ]);
    expect(parseBody("> No citation here")).toEqual([{ kind: "quote", text: "No citation here", inlines: plain("No citation here") }]);
  });
  it("treats every other non-empty line as a paragraph and skips blank lines", () => {
    expect(parseBody("First.\n\n  Second.  \r\n\n")).toEqual([
      { kind: "paragraph", text: "First.", inlines: plain("First.") },
      { kind: "paragraph", text: "Second.", inlines: plain("Second.") },
    ]);
  });
  it("returns an empty list for empty input", () => {
    expect(parseBody("")).toEqual([]);
    expect(parseBody(undefined)).toEqual([]);
  });
  it("reads every older built-in story exactly as before: one plain run per prose block", () => {
    for (const p of builtinPosts.filter((x) => x.slug !== "seed-bombers-2023")) {
      for (const body of [p.body_en, p.body_hi]) {
        for (const b of parseBody(body)) {
          expect(["heading", "paragraph", "quote"]).toContain(b.kind);
          if (b.kind === "heading" || b.kind === "paragraph" || b.kind === "quote") {
            expect(b.inlines).toEqual(plain(b.text));
          }
        }
        expect(serializeBody(parseBody(body))).toBe(parseBody(body).length ? body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join("\n") : "");
      }
    }
  });
});

describe("parseBody, the new line kinds", () => {
  it("finds the bold phrase, the link and the film in the seed-bombing story", () => {
    const blocks = parseBody(builtinPosts.find((x) => x.slug === "seed-bombers-2023")!.body_en);
    const runs = blocks.flatMap((b) => ("inlines" in b ? b.inlines : []));
    expect(runs.some((r) => r.bold && r.text === "2,00,000 seeds")).toBe(true);
    expect(runs.some((r) => r.href === "https://www.un.org/en/observances/environment-day")).toBe(true);
    expect(blocks[blocks.length - 1]).toEqual({ kind: "youtube", url: "https://youtu.be/XTmHXvDXcI0", id: "XTmHXvDXcI0" });
  });
  it("groups consecutive '- ' lines into one bulleted list", () => {
    expect(parseBody("- One\n- Two\nAfter")).toEqual([
      { kind: "list", ordered: false, items: [plain("One"), plain("Two")] },
      { kind: "paragraph", text: "After", inlines: plain("After") },
    ]);
  });
  it("groups consecutive numbered lines into one numbered list whatever the numbers say", () => {
    expect(parseBody("1. One\n7. Two\n\n- Bullet")).toEqual([
      { kind: "list", ordered: true, items: [plain("One"), plain("Two")] },
      { kind: "list", ordered: false, items: [plain("Bullet")] },
    ]);
  });
  it("reads a photo line with its caption and path", () => {
    expect(parseBody("![Tying the thread](media:posts/a/b.jpg)")).toEqual([{ kind: "image", path: "posts/a/b.jpg", caption: "Tying the thread" }]);
    expect(parseBody("![](media:posts/a/b.jpg)")).toEqual([{ kind: "image", path: "posts/a/b.jpg", caption: "" }]);
  });
  it("reads a film line and keeps its id", () => {
    expect(parseBody("@youtube(https://youtu.be/XTmHXvDXcI0)")).toEqual([{ kind: "youtube", url: "https://youtu.be/XTmHXvDXcI0", id: "XTmHXvDXcI0" }]);
  });
  it("leaves a film line with a bad link as a paragraph", () => {
    expect(parseBody("@youtube(https://example.org/x)")[0].kind).toBe("paragraph");
  });
});

describe("parseInline", () => {
  it("reads bold, italic and links, nested in any order", () => {
    expect(parseInline("Plain **bold** and _italic_ and **_both_** here")).toEqual([
      { text: "Plain " },
      { text: "bold", bold: true },
      { text: " and " },
      { text: "italic", italic: true },
      { text: " and " },
      { text: "both", bold: true, italic: true },
      { text: " here" },
    ]);
    expect(parseInline("See [the **letter**](https://example.org/l) now")).toEqual([
      { text: "See " },
      { text: "the ", href: "https://example.org/l" },
      { text: "letter", bold: true, href: "https://example.org/l" },
      { text: " now" },
    ]);
  });
  it("honours backslash escapes and leaves a lone asterisk alone", () => {
    expect(parseInline("2 \\* 3 and a\\_b and \\[x\\] and 5 * 2")).toEqual([{ text: "2 * 3 and a_b and [x] and 5 * 2" }]);
  });
  it("treats an unclosed marker as text", () => {
    expect(parseInline("**open and _also")).toEqual([{ text: "**open and _also" }]);
    expect(parseInline("[not a link")).toEqual([{ text: "[not a link" }]);
  });
});

describe("serialize", () => {
  it("writes marks and links back, escaping what would read as markup", () => {
    expect(serializeInline([{ text: "a " }, { text: "b", bold: true }, { text: " c", italic: true }, { text: "d", href: "https://x.in" }])).toBe("a **b**_ c_[d](https://x.in)");
    expect(serializeInline([{ text: "2 * 3, a_b, [x] and \\" }])).toBe("2 \\* 3, a\\_b, \\[x\\] and \\\\");
  });
  it("escapes line-start characters so a paragraph never turns into another block", () => {
    const blocks: Block[] = [
      { kind: "paragraph", text: "## not a heading", inlines: plain("## not a heading") },
      { kind: "paragraph", text: "- not a list", inlines: plain("- not a list") },
      { kind: "paragraph", text: "1. not a list", inlines: plain("1. not a list") },
      { kind: "paragraph", text: "> not a quote", inlines: plain("> not a quote") },
      { kind: "paragraph", text: "@youtube(x)", inlines: plain("@youtube(x)") },
      { kind: "paragraph", text: "![x](media:y)", inlines: plain("![x](media:y)") },
    ];
    expect(parseBody(serializeBody(blocks))).toEqual(blocks);
  });
  it("round-trips every block shape", () => {
    const blocks: Block[] = [
      { kind: "heading", text: "A heading with bold", inlines: [{ text: "A heading with " }, { text: "bold", bold: true }] },
      { kind: "paragraph", text: "Read the letter here.", inlines: [{ text: "Read " }, { text: "the letter", href: "https://x.in/a" }, { text: " here." }] },
      { kind: "quote", text: "Be careful in time.", inlines: plain("Be careful in time."), cite: "Manoj Dhyani" },
      { kind: "quote", text: "No source", inlines: plain("No source") },
      { kind: "list", ordered: false, items: [plain("One"), [{ text: "Two ", italic: true }, { text: "bold", bold: true }]] },
      { kind: "list", ordered: true, items: [plain("First"), plain("Second")] },
      { kind: "image", path: "posts/a/b.jpg", caption: "Tying the [thread]" },
      { kind: "youtube", url: "https://youtu.be/XTmHXvDXcI0", id: "XTmHXvDXcI0" },
      { kind: "paragraph", text: "Last", inlines: plain("Last") },
    ];
    const text = serializeBody(blocks);
    expect(parseBody(text)).toEqual(blocks);
    expect(serializeBody(parseBody(text))).toBe(text);
  });
  it("writes the citation with the same separator the old format used", () => {
    expect(serializeBody([{ kind: "quote", text: "Q", inlines: plain("Q"), cite: "Name" }])).toBe("> Q — Name");
  });
});

describe("plainText", () => {
  it("joins runs and drops marks", () => {
    expect(plainText([{ text: "a " }, { text: "b", bold: true, href: "https://x.in" }])).toBe("a b");
  });
});
