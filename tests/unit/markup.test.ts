import { describe, expect, it } from "vitest";
import { parseBody } from "@/lib/content/markup";

describe("parseBody", () => {
  it("turns '## ' lines into headings", () => {
    expect(parseBody("## Ten years of warnings")).toEqual([{ kind: "heading", text: "Ten years of warnings" }]);
  });
  it("turns '> ' lines into quotes and splits a trailing citation", () => {
    expect(parseBody("> Be careful in time. — Manoj Dhyani")).toEqual([
      { kind: "quote", text: "Be careful in time.", cite: "Manoj Dhyani" },
    ]);
    expect(parseBody("> No citation here")).toEqual([{ kind: "quote", text: "No citation here" }]);
  });
  it("treats every other non-empty line as a paragraph and skips blank lines", () => {
    expect(parseBody("First.\n\n  Second.  \r\n\n")).toEqual([
      { kind: "paragraph", text: "First." },
      { kind: "paragraph", text: "Second." },
    ]);
  });
  it("returns an empty list for empty input", () => {
    expect(parseBody("")).toEqual([]);
    expect(parseBody(undefined)).toEqual([]);
  });
});
