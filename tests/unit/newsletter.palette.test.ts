import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/color/contrast";
import { PALETTE, PALETTE_TOKENS } from "@/lib/newsletter/palette";

function tokensOf(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const out: Record<string, string> = {};
  for (const m of css.slice(open + 1, close).matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}

describe("the mail palette", () => {
  const light = tokensOf(readFileSync("src/styles/tokens.css", "utf8"), ':root[data-theme="light"]');
  it("is the light theme of tokens.css, value for value", () => {
    for (const [key, token] of Object.entries(PALETTE_TOKENS)) expect(PALETTE[key as keyof typeof PALETTE].toUpperCase(), token).toBe(light[token].toUpperCase());
  });
  it("reads on paper", () => {
    expect(contrastRatio(PALETTE.paperInk, PALETTE.paper)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(PALETTE.paperInk2, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.gold, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.sutra, PALETTE.paper)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio("#FFFFFF", PALETTE.sutra)).toBeGreaterThanOrEqual(4.5);
  });
});
