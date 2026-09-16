import { describe, expect, it } from "vitest";
import { ytId } from "@/lib/content/youtube";

describe("ytId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=10", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extracts the id from %s", (url, id) => {
    expect(ytId(url)).toBe(id);
  });
  it("returns null for anything else", () => {
    expect(ytId("https://example.com/watch?v=abc")).toBeNull();
    expect(ytId("")).toBeNull();
    expect(ytId(undefined)).toBeNull();
  });
});
