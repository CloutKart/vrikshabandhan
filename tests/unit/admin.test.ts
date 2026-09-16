import { describe, expect, it } from "vitest";
import { emptyDraft, parseTags, validateDraft } from "@/lib/content/admin";

describe("parseTags", () => {
  it("splits on commas, trims and drops empties and duplicates", () => {
    expect(parseTags(" Open letter, Himalaya ,, open letter ,Memory")).toEqual(["Open letter", "Himalaya", "Memory"]);
  });
});

describe("validateDraft", () => {
  it("requires an English title and a date", () => {
    const errors = validateDraft({ ...emptyDraft(), title_en: "", date: "" });
    expect(errors.title_en).toBeDefined();
    expect(errors.date).toBeDefined();
  });
  it("requires a description for every photo before publishing", () => {
    const draft = { ...emptyDraft(), title_en: "T", date: "2024-01-01", live: true, media: [{ path: "p", type: "image" as const, alt_en: "", alt_hi: "" }] };
    expect(validateDraft(draft).media).toBeDefined();
    expect(validateDraft({ ...draft, live: false }).media).toBeUndefined();
  });
  it("rejects a video link that is not a YouTube link, and accepts youtu.be", () => {
    const base = { ...emptyDraft(), title_en: "T", date: "2024-01-01" };
    expect(validateDraft({ ...base, yt: "https://example.com/watch?v=abc" }).yt).toBeDefined();
    expect(validateDraft({ ...base, yt: "https://youtu.be/XTmHXvDXcI0" }).yt).toBeUndefined();
    expect(validateDraft({ ...base, yt: "" }).yt).toBeUndefined();
  });
  it("accepts a complete draft", () => {
    expect(validateDraft({ ...emptyDraft(), title_en: "T", date: "2024-01-01" })).toEqual({});
  });
});
