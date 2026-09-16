import { describe, expect, it } from "vitest";
import { formatStoryDate } from "@/lib/i18n/format";

describe("formatStoryDate", () => {
  it("formats in English with the full month", () => {
    expect(formatStoryDate("2023-12-11", "en")).toBe("11 December 2023");
  });
  it("formats in Hindi with a Devanagari month name", () => {
    expect(formatStoryDate("2023-12-11", "hi")).toContain("दिसंबर");
  });
  it("returns the raw string when the date is invalid", () => {
    expect(formatStoryDate("not-a-date", "en")).toBe("not-a-date");
  });
});
