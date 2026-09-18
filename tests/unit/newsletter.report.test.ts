import { describe, expect, it } from "vitest";
import { describeSend } from "@/lib/newsletter/report";
import type { SendReport } from "@/lib/newsletter/types";

const base = { total: 0, sent: 0, failed: 0 };
const cases: Array<[SendReport | null, string]> = [
  [null, "Saved as a draft."],
  [{ ...base, status: "sent", sent: 132, total: 132 }, "Published. Sent to 132 subscribers."],
  [{ ...base, status: "sent", sent: 1, total: 1 }, "Published. Sent to 1 subscriber."],
  [{ ...base, status: "partial", sent: 130, failed: 2, total: 132 }, "Published. Sent to 130 subscribers, 2 failed. Retry from the story page."],
  [{ ...base, status: "none" }, "Published. No confirmed subscribers yet."],
  [{ ...base, status: "already", sentAt: "2023-12-11T10:00:00Z" }, "Published. Already sent to subscribers on 11 December 2023."],
  [{ ...base, status: "test", total: 132, testTo: "owner@example.org" }, "Published. Test mode: both editions went to owner@example.org; 132 subscribers would have received it."],
  [{ ...base, status: "off" }, "Published. E-mail is not set up yet (see docs/deploy.md)."],
  [{ ...base, status: "error", reason: "newsletter: not allowed" }, "Published, but the e-mail could not be sent: newsletter: not allowed."],
];

describe("describeSend", () => {
  it.each(cases)("%o", (report, sentence) => {
    const s = describeSend(report);
    expect(s).toBe(sentence);
    expect(s).not.toMatch(/[—·]/);
  });
});
