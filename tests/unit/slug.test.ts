import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/content/slug";

describe("slugify", () => {
  it("lowercases, strips punctuation and joins with hyphens", () => {
    expect(slugify("Why is the historic movement of Shriyantra Island forgotten?", "x")).toBe(
      "why-is-the-historic-movement-of-shriyantra-island-forgotten",
    );
  });
  it("folds diacritics", () => {
    expect(slugify("Śrī Yantra Tāpū", "x")).toBe("sri-yantra-tapu");
  });
  it("falls back when nothing latin survives", () => {
    expect(slugify("सिल्क्यारा की त्रासदी", "2023-12-11")).toBe("2023-12-11");
  });
  it("caps the length without leaving a trailing hyphen", () => {
    const s = slugify("word ".repeat(40), "x");
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
});
