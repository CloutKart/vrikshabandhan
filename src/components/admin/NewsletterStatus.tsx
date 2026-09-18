import { formatStoryDate } from "@/lib/i18n/format";
import { NewsletterActions } from "./NewsletterActions";

export type DeliverySummary = { sent: number; failed: number; queued: number; failures: Array<{ email: string; error: string }> };

type Props = {
  postId: string;
  live: boolean;
  sentAt: string | null;
  test: boolean;
  /** Confirmed subscribers right now. */
  count: number;
  deliveries: DeliverySummary;
  /** The newsletter is configured on this deployment. */
  on: boolean;
  /** The test address while test mode is on, else null. */
  testTo: string | null;
};

const when = (iso: string) => formatStoryDate(iso.slice(0, 10), "en");

/** Above the editor: whether the story has gone to subscribers, and the buttons that act on it. */
export function NewsletterStatus({ postId, live, sentAt, test, count, deliveries, on, testTo }: Props) {
  let text: string;
  let promote = false;
  let retry = false;
  if (!on) text = "E-mail is not set up on this deployment yet, so publishing does not mail anyone. See docs/deploy.md.";
  else if (!sentAt) text = `Not yet sent to subscribers. ${live ? "Saving it again" : "Publishing"} sends it to ${count} confirmed subscriber${count === 1 ? "" : "s"}, once.`;
  else if (test) {
    text = `Test mode: sent to ${testTo ?? "the test address"} on ${when(sentAt)}. No subscriber has received it.`;
    promote = !testTo && live;
    if (promote) text += ` Test mode is off now; the button sends it to ${count} confirmed subscriber${count === 1 ? "" : "s"}.`;
  } else if (deliveries.failed || deliveries.queued) {
    retry = true;
    text = `Sent to ${deliveries.sent} subscriber${deliveries.sent === 1 ? "" : "s"} on ${when(sentAt)}; ${deliveries.failed + deliveries.queued} not delivered.`;
  } else text = `Sent to ${deliveries.sent} subscriber${deliveries.sent === 1 ? "" : "s"} on ${when(sentAt)}.`;

  return (
    <aside data-newsletter-status className="rounded-[var(--radius-panel)] border border-moss/60 px-5 py-4 font-sans text-sm">
      <p className="text-ink">Subscribers</p>
      <p className="mt-1 max-w-[70ch] text-ink-2">{text}</p>
      {deliveries.failures.length ? (
        <ul className="mt-2 max-w-[70ch] text-ink-2">
          {deliveries.failures.slice(0, 10).map((f, i) => (
            <li key={`${i}-${f.email}`}>
              Could not send to {f.email}: {f.error.toLowerCase()}
            </li>
          ))}
          {deliveries.failures.length > 10 ? <li>and {deliveries.failures.length - 10} more</li> : null}
        </ul>
      ) : null}
      {on ? <NewsletterActions postId={postId} count={count} promote={promote} retry={retry} preview={live || Boolean(sentAt)} /> : null}
    </aside>
  );
}
