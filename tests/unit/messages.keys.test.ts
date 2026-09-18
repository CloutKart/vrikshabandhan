import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Every visible string lives in both files with identical keys, and both files are valid JSON. */
function keysOf(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix.slice(0, -1)];
  return Object.entries(value).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`));
}

describe("messages", () => {
  const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
  const hi = JSON.parse(readFileSync("messages/hi.json", "utf8"));
  it("have identical keys in English and Hindi", () => {
    expect(keysOf(hi).sort()).toEqual(keysOf(en).sort());
  });
});
