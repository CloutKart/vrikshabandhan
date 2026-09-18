import { describe, expect, it } from "vitest";
import { isRetryable } from "@/lib/newsletter/resend";
import { EMAIL, UNSUBSCRIBE_URL } from "@/lib/newsletter/render";
import { applyTestMode, idempotencyKey, personalise, planBatches } from "@/lib/newsletter/send";
import type { Recipient } from "@/lib/newsletter/types";

const r = (i: number): Recipient => ({ id: `id${i}`, email: `p${i}@example.org`, locale: i % 2 ? "hi" : "en", unsubscribe_token: "t".repeat(64) });

describe("send planning", () => {
  it("cuts recipients into batches of 100 in order", () => {
    const all = Array.from({ length: 250 }, (_, i) => r(i));
    const b = planBatches(all);
    expect(b.map((x) => x.length)).toEqual([100, 100, 50]);
    expect(b[2][49].id).toBe("id249");
  });
  it("collapses test mode to two editions for the owner and keeps the real count", () => {
    const t = applyTestMode(Array.from({ length: 7 }, (_, i) => r(i)), "owner@example.org");
    expect(t.recipients.map((x) => [x.email, x.locale])).toEqual([["owner@example.org", "en"], ["owner@example.org", "hi"]]);
    expect(t.prefix).toBe("[Test, 7 subscribers] ");
    expect(t.recipients.map((x) => x.unsubscribe_token)).toEqual(["test", "test"]);
  });
  it("gives the stand-ins the owner's own token when the owner is a subscriber", () => {
    const owner: Recipient = { id: "own", email: "owner@example.org", locale: "hi", unsubscribe_token: "a".repeat(64) };
    const t = applyTestMode([r(0), owner, r(2)], "Owner@Example.org");
    expect(t.recipients.map((x) => [x.id, x.locale, x.unsubscribe_token])).toEqual([["own", "en", "a".repeat(64)], ["own", "hi", "a".repeat(64)]]);
    expect(t.recipients.every((x) => x.email === "Owner@Example.org")).toBe(true);
  });
  it("keys the first attempt and retries differently", () => {
    expect(idempotencyKey("p", 2)).toBe("nl-p-2");
    expect(idempotencyKey("p", 2, 1)).toBe("nl-p-2-r1");
  });
  it("retries rate limits and outages, never refusals", () => {
    expect(isRetryable(429)).toBe(true);
    expect(isRetryable(503)).toBe(true);
    expect(isRetryable(403)).toBe(false);
    expect(isRetryable(422)).toBe(false);
  });
});

describe("personalise", () => {
  it("fills the address and links without expanding replacement patterns", () => {
    const edition = { subject: "S", html: `<p>${EMAIL}</p><a href="${UNSUBSCRIBE_URL}">u</a>`, text: `${EMAIL} ${UNSUBSCRIBE_URL}` };
    const odd = { ...r(1), email: "a$&b@example.org" };
    const m = personalise(edition, odd, { from: "s@x.in", replyTo: "r@x.in", siteUrl: "https://x.in" });
    expect(m.html).toContain("a$&amp;b@example.org");
    expect(m.text).toContain("a$&b@example.org");
    expect(m.html).toContain(`https://x.in/hi/newsletter/unsubscribe?t=${"t".repeat(64)}`);
    expect(m.headers?.["List-Unsubscribe"]).toContain("/api/newsletter/unsubscribe?t=");
    expect(m.to).toEqual(["a$&b@example.org"]);
    expect(m.html).not.toContain("%%");
    expect(m.text).not.toContain("%%");
  });
});
