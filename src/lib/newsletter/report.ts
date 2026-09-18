import { formatStoryDate } from "@/lib/i18n/format";
import type { SendReport } from "./types";

function plural(n: number) {
  return `${n} subscriber${n === 1 ? "" : "s"}`;
}

/** The sentence the editor reads after saving. Admin copy is English, like the rest of /admin. */
export function describeSend(r: SendReport | null): string {
  if (!r) return "Saved as a draft.";
  switch (r.status) {
    case "sent":
      return `Published. Sent to ${plural(r.sent)}.`;
    case "partial":
      return `Published. Sent to ${plural(r.sent)}, ${r.failed} failed. Retry from the story page.`;
    case "none":
      return "Published. No confirmed subscribers yet.";
    case "already":
      return r.sentAt ? `Published. Already sent to subscribers on ${formatStoryDate(r.sentAt.slice(0, 10), "en")}.` : "Published. Already sent to subscribers.";
    case "test":
      return `Published. Test mode: both editions went to ${r.testTo ?? "the test address"}; ${plural(r.total)} would have received it.`;
    case "off":
      return "Published. E-mail is not set up yet (see docs/deploy.md).";
    case "not-live":
      return "Saved as a draft.";
    case "error":
      return `Published, but the e-mail could not be sent: ${r.reason ?? "unknown error"}.`;
  }
}
