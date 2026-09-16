import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/color/contrast";

/** Pull `--name: #hex` pairs out of one CSS block. */
function tokensOf(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const block = css.slice(open + 1, close);
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}

const css = readFileSync("src/styles/tokens.css", "utf8");
const themes = {
  dark: tokensOf(css, ":root {"),
  light: tokensOf(css, ':root[data-theme="light"]'),
};

/** [foreground, background, minimum ratio, why] */
const pairs: Array<[string, string, number, string]> = [
  ["ink", "ground", 7, "body text on the page ground"],
  ["ink", "ground-2", 4.5, "text on raised surfaces"],
  ["ink-2", "ground", 4.5, "secondary text"],
  ["gold", "ground", 3, "focus ring and large numerals"],
  ["sutra", "ground", 3, "thread, underlines, display red"],
  ["paper-ink", "paper", 7, "reading sheet text"],
  ["sutra", "paper", 3, "underlines on paper"],
  ["moss", "ground", 3, "rules and borders"],
];

describe.each(Object.entries(themes))("%s theme contrast", (_name, t) => {
  it.each(pairs)("%s on %s is at least %s:1 (%s)", (fg, bg, min) => {
    expect(t[fg], `token --${fg} missing`).toBeDefined();
    expect(t[bg], `token --${bg} missing`).toBeDefined();
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#12211A", "#12211A")).toBe(1);
  });
});
