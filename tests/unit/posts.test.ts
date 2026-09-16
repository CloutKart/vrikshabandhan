import { describe, expect, it } from "vitest";
import { mergePosts, pick } from "@/lib/content/posts";
import type { Post } from "@/lib/content/types";

const base: Post = {
  id: "1",
  slug: "a",
  title_en: "English title",
  title_hi: "",
  summary_en: "",
  summary_hi: "",
  body_en: "Body",
  body_hi: "",
  date: "2023-01-01",
  place: "",
  tags: [],
  yt: "",
  media: [],
  live: true,
};

describe("mergePosts", () => {
  it("prefers the database copy of a slug and sorts by date, newest first", () => {
    const db: Post[] = [{ ...base, slug: "a", date: "2024-05-01", title_en: "DB copy" }];
    const builtin: Post[] = [
      { ...base, slug: "a", date: "2023-01-01" },
      { ...base, id: "2", slug: "b", date: "2023-06-01" },
      { ...base, id: "3", slug: "c", date: "2025-01-01" },
    ];
    const merged = mergePosts(db, builtin);
    expect(merged.map((p) => p.slug)).toEqual(["c", "a", "b"]);
    expect(merged.find((p) => p.slug === "a")?.title_en).toBe("DB copy");
  });
});

describe("pick", () => {
  it("returns the Hindi field with lang hi when it exists", () => {
    expect(pick({ ...base, title_hi: "हिंदी शीर्षक" }, "title", "hi")).toEqual({ text: "हिंदी शीर्षक", lang: "hi" });
  });
  it("falls back to English and says so", () => {
    expect(pick(base, "title", "hi")).toEqual({ text: "English title", lang: "en" });
    expect(pick(base, "body", "hi")).toEqual({ text: "Body", lang: "en" });
  });
  it("returns English for the English locale", () => {
    expect(pick({ ...base, title_hi: "x" }, "title", "en")).toEqual({ text: "English title", lang: "en" });
  });
});
