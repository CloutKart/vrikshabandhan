import { describe, expect, it } from "vitest";
import { emptyDraft, localDate, missingPhotos, parseTags, savePayload, validateDraft } from "@/lib/content/admin";

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

describe("localDate", () => {
  it("uses the editor's own calendar day, not the UTC one", () => {
    // 01:30 on 2 June local time, whatever the zone: the UTC date may still be 1 June.
    const d = new Date(2024, 5, 2, 1, 30);
    expect(localDate(d)).toBe("2024-06-02");
  });
});

describe("savePayload", () => {
  it("leaves a post that is not deleted alone", () => {
    const d = { ...emptyDraft(), title_en: "T" };
    expect(savePayload(d, null)).toEqual(d);
    expect("deleted_at" in savePayload(d, null)).toBe(false);
  });
  it("brings a deleted post back when it is saved", () => {
    const d = { ...emptyDraft(), title_en: "T", live: false };
    expect(savePayload(d, "2026-09-18T10:00:00Z")).toEqual({ ...d, deleted_at: null });
  });
});

describe("photos placed in the text", () => {
  const media = [{ path: "posts/x/a.jpg", type: "image" as const, alt_en: "A", alt_hi: "" }];
  it("names the ones no longer among the uploads", () => {
    expect(missingPhotos("Text\n![c](media:posts/x/a.jpg)\n![c](media:posts/x/gone.jpg)", media)).toEqual(["posts/x/gone.jpg"]);
    expect(missingPhotos("Text", [])).toEqual([]);
  });
  it("block publishing, not saving a draft", () => {
    const d = { ...emptyDraft(), title_en: "T", media, body_en: "![c](media:posts/x/gone.jpg)" };
    expect(validateDraft({ ...d, live: false })).toEqual({});
    expect(validateDraft({ ...d, live: true }).body_en).toMatch(/removed from the uploads/);
  });
});
