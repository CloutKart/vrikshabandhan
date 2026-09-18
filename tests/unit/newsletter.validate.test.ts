import { describe, expect, it } from "vitest";
import { cleanEmail, cleanLocale, isToken, parseSubscribeInput } from "@/lib/newsletter/validate";

describe("cleanEmail", () => {
  it("trims and lower-cases", () => expect(cleanEmail("  Name@Example.COM ")).toBe("name@example.com"));
  it("rejects what a provider would refuse", () => {
    for (const bad of ["", "name", "name@", "@example.com", "na me@example.com", "name@example", "name@-example.com", ".name@example.com", "na..me@example.com", `${"a".repeat(65)}@example.com`, `name@${"b".repeat(250)}.com`, 42, null])
      expect(cleanEmail(bad), String(bad)).toBeNull();
  });
  it("accepts plus tags and Devanagari-free unusual but valid locals", () => {
    expect(cleanEmail("first.last+tag@sub.example.co.in")).toBe("first.last+tag@sub.example.co.in");
    expect(cleanEmail("o'neil@example.org")).toBe("o'neil@example.org");
  });
});

describe("cleanLocale", () => {
  it("keeps a known language and falls back otherwise", () => {
    expect(cleanLocale("hi", "en")).toBe("hi");
    expect(cleanLocale("fr", "hi")).toBe("hi");
    expect(cleanLocale(undefined, "en")).toBe("en");
  });
});

describe("parseSubscribeInput", () => {
  const form = (fields: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    return f;
  };
  it("reads the address, the language and the honeypot", () => {
    expect(parseSubscribeInput(form({ email: "A@B.co", locale: "hi", website: "" }), "en")).toEqual({ email: "a@b.co", locale: "hi", trap: false });
    expect(parseSubscribeInput(form({ email: "a@b.co", website: "http://spam" }), "hi")).toEqual({ email: "a@b.co", locale: "hi", trap: true });
    expect(parseSubscribeInput(form({ email: "nope" }), "en")).toBeNull();
  });
});

describe("isToken", () => {
  it("accepts exactly 64 hex characters", () => {
    expect(isToken("a".repeat(64))).toBe(true);
    expect(isToken("A".repeat(64))).toBe(false);
    expect(isToken("a".repeat(63))).toBe(false);
    expect(isToken(null)).toBe(false);
  });
});
