import { describe, expect, it } from "vitest";
import { emptyDraft } from "@/lib/content/admin";
import { clearCopy, copyKey, readCopy, sameDraft, shouldOffer, writeCopy } from "@/lib/editor/recovery";

function store() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe("draft copies", () => {
  const base = { ...emptyDraft(), title_en: "T", body_en: "Text" };

  it("keys a post by id and a new post by itself", () => {
    expect(copyKey("abc")).toBe("va-draft-abc");
    expect(copyKey(undefined)).toBe("va-draft-new");
  });
  it("writes, reads and clears a copy, and survives a broken store", () => {
    const s = store();
    writeCopy(s, "k", base, new Date("2026-09-18T10:00:00Z"));
    expect(readCopy(s, "k")).toEqual({ savedAt: "2026-09-18T10:00:00.000Z", draft: base });
    clearCopy(s, "k");
    expect(readCopy(s, "k")).toBeNull();
    s.setItem("k", "{not json");
    expect(readCopy(s, "k")).toBeNull();
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(readCopy(broken, "k")).toBeNull();
    expect(() => writeCopy(broken, "k", base)).not.toThrow();
    expect(() => clearCopy(broken, "k")).not.toThrow();
  });
  it("compares the fields a writer can change and nothing else", () => {
    expect(sameDraft(base, { ...base })).toBe(true);
    expect(sameDraft(base, { ...base, body_hi: "x" })).toBe(false);
    expect(sameDraft(base, { ...base, tags: ["a"] })).toBe(false);
  });
  it("offers a copy only when it differs from the row and is newer than the row's save", () => {
    const copy = { savedAt: "2026-09-18T10:00:00Z", draft: { ...base, body_en: "Text and more" } };
    expect(shouldOffer(null, base)).toBe(false);
    expect(shouldOffer({ ...copy, draft: base }, base)).toBe(false);
    expect(shouldOffer(copy, base)).toBe(true);
    expect(shouldOffer(copy, base, "2026-09-18T09:00:00Z")).toBe(true);
    expect(shouldOffer(copy, base, "2026-09-18T11:00:00Z")).toBe(false);
  });
});
