"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import type { ConfirmState, NewsletterLabels, SubscribeState, UnsubscribeState } from "@/lib/newsletter/types";
import { MarkSubscribed } from "./MarkSubscribed";
import { NewsletterForm } from "./NewsletterForm";

type Copy = { text: string; cta: string; done: string; failed: string; resubscribe: string; readStories: string; languageEn: string; languageHi: string };
type SubscribeAction = (prev: SubscribeState, form: FormData) => Promise<SubscribeState>;

function fillVars(text: string, vars: Record<string, string>) {
  let out = text;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v);
  return out;
}

/**
 * The body of the confirmation and unsubscribe pages: one button that POSTs
 * (a link opened by a mail scanner changes nothing), then the outcome. An
 * expired or invalid link shows the subscribe form again.
 */
export function ConfirmCard({ token, locale, copy, labels, action, subscribeAction }: { token: string | null; locale: Locale; copy: Copy; labels: NewsletterLabels; action: (prev: ConfirmState, form: FormData) => Promise<ConfirmState>; subscribeAction: SubscribeAction }) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as ConfirmState);
  if (state.status === "confirmed") {
    const language = state.locale === "hi" ? copy.languageHi : copy.languageEn;
    return (
      <>
        <MarkSubscribed />
        <p role="status" className="max-w-[48ch]">
          {fillVars(copy.done, { email: state.email ?? "", language })}
        </p>
        <div className="mt-8">
          <Button href="/stories">{copy.readStories}</Button>
        </div>
      </>
    );
  }
  if (state.status === "off") {
    return (
      <p role="status" className="max-w-[48ch] text-paper-ink-2">
        {labels.unavailable}
      </p>
    );
  }
  if (!token || state.status === "expired") {
    return (
      <>
        <p role="status" className="max-w-[48ch]">
          {copy.failed}
        </p>
        <p className="mt-8 font-sans text-sm text-paper-ink-2">{copy.resubscribe}</p>
        <div className="mt-3 max-w-[36rem] [--ground-2:var(--paper)] [--ink:var(--paper-ink)] [--ink-2:var(--paper-ink-2)]">
          <NewsletterForm labels={labels} locale={locale} action={subscribeAction} />
        </div>
      </>
    );
  }
  return (
    <form action={formAction}>
      <input type="hidden" name="t" value={token} />
      <p className="max-w-[48ch]">{copy.text}</p>
      <div className="mt-8">
        <Button type="submit" disabled={pending}>
          {copy.cta}
        </Button>
      </div>
    </form>
  );
}

export function UnsubscribeCard({ token, locale, copy, labels, action, subscribeAction }: { token: string | null; locale: Locale; copy: Copy; labels: NewsletterLabels; action: (prev: UnsubscribeState, form: FormData) => Promise<UnsubscribeState>; subscribeAction: SubscribeAction }) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as UnsubscribeState);
  if (state.status === "unsubscribed") {
    return (
      <>
        <p role="status" className="max-w-[48ch]">
          {fillVars(copy.done, { email: state.email ?? "" })}
        </p>
        <div className="mt-8">
          <Button href="/stories">{copy.readStories}</Button>
        </div>
        <p className="mt-10 font-sans text-sm text-paper-ink-2">{copy.resubscribe}</p>
        <div className="mt-3 max-w-[36rem] [--ground-2:var(--paper)] [--ink:var(--paper-ink)] [--ink-2:var(--paper-ink-2)]">
          <NewsletterForm labels={labels} locale={locale} action={subscribeAction} />
        </div>
      </>
    );
  }
  if (state.status === "off") {
    return (
      <p role="status" className="max-w-[48ch] text-paper-ink-2">
        {labels.unavailable}
      </p>
    );
  }
  if (!token || state.status === "invalid") {
    return (
      <p role="status" className="max-w-[48ch]">
        {copy.failed}
      </p>
    );
  }
  return (
    <form action={formAction}>
      <input type="hidden" name="t" value={token} />
      <p className="max-w-[48ch]">{copy.text}</p>
      <div className="mt-8">
        <Button type="submit" disabled={pending}>
          {copy.cta}
        </Button>
      </div>
    </form>
  );
}
