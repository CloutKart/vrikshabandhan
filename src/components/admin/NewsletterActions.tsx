"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { retryFailedDeliveries, sendNewsletterPreview, sendStoryNewsletter } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { describeSend } from "@/lib/newsletter/report";
import type { SendReport } from "@/lib/newsletter/types";

type Props = { postId: string; count: number; promote: boolean; retry: boolean; preview: boolean };

/** The buttons under the subscriber status: preview, retry, and the one deliberate send after test mode. */
export function NewsletterActions({ postId, count, promote, retry, preview }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  async function run(work: () => Promise<SendReport>, wording?: (r: SendReport) => string) {
    setBusy(true);
    try {
      const report = await work();
      toast(wording ? wording(report) : describeSend(report), undefined, 8000);
      router.refresh();
    } catch (e) {
      toast(`Could not do that: ${e instanceof Error ? e.message : "unknown error"}`, undefined, 8000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {preview ? (
        <Button variant="line" disabled={busy} onClick={() => run(() => sendNewsletterPreview(postId), (r) => (r.status === "sent" ? "Both editions are on their way to your inbox, marked as a preview." : describeSend(r).replace(/^Published/, "Preview")))}>
          Send me a preview
        </Button>
      ) : null}
      {retry ? (
        <Button variant="line" disabled={busy} onClick={() => run(() => retryFailedDeliveries(postId), (r) => describeSend(r).replace(/^Published\. /, "Retried. "))}>
          Retry the failed
        </Button>
      ) : null}
      {promote ? (
        <>
          <Button disabled={busy} onClick={() => dialog.current?.showModal()}>
            Send to {count} subscriber{count === 1 ? "" : "s"}
          </Button>
          <dialog ref={dialog} className="ask" aria-labelledby="send-confirm-title">
            <h2 id="send-confirm-title" className="text-[1.5rem] leading-tight">
              Send this story to {count} subscriber{count === 1 ? "" : "s"}?
            </h2>
            <p className="mt-3 text-ink-2">Each gets it once, in their language. This cannot be undone.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                disabled={busy}
                onClick={() => {
                  dialog.current?.close();
                  void run(() => sendStoryNewsletter(postId, { fromTest: true }));
                }}
              >
                Send to {count} subscriber{count === 1 ? "" : "s"}
              </Button>
              <Button variant="line" onClick={() => dialog.current?.close()}>
                Keep it unsent
              </Button>
            </div>
          </dialog>
        </>
      ) : null}
    </div>
  );
}
