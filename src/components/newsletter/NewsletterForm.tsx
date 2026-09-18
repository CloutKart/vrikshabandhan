"use client";

import { useActionState, useEffect, useId } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import type { Locale } from "@/i18n/routing";
import type { NewsletterLabels, SubscribeState } from "@/lib/newsletter/types";

type Action = (prev: SubscribeState, form: FormData) => Promise<SubscribeState>;

type Props = {
  labels: NewsletterLabels;
  locale: Locale;
  action: Action;
  /** Called once the confirmation link has gone out (or the honeypot swallowed the submit). */
  onSent?: (email: string) => void;
  /** Where the form is used, for the accessible name of the group. */
  titleId?: string;
};

/**
 * The subscribe form: an address, a language, a button. A real form, so it
 * posts without JavaScript; with it, the result replaces the form in place.
 */
export function NewsletterForm({ labels, locale, action, onSent, titleId }: Props) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as SubscribeState);
  const id = useId();
  const emailId = `${id}-email`;
  const errorText = state.status === "invalid" ? labels.invalid : state.status === "rateLimited" ? labels.rateLimited : state.status === "failed" ? labels.failed : undefined;

  useEffect(() => {
    if (state.status === "sent" && state.email) onSent?.(state.email);
  }, [state, onSent]);

  if (state.status === "sent") {
    return (
      <p role="status" className="max-w-[44ch]">
        {labels.sent.split("{email}").join(state.email ?? "")}
      </p>
    );
  }
  if (state.status === "off") {
    return (
      <p role="status" className="max-w-[44ch] text-ink-2">
        {labels.unavailable}
      </p>
    );
  }

  return (
    <form action={formAction} aria-labelledby={titleId} className="grid gap-4" data-newsletter-form>
      <input type="hidden" name="pageLocale" value={locale} />
      <Field id={emailId} label={labels.emailLabel} error={errorText}>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={errorText ? `${emailId}-error` : undefined}
          className={inputClass}
        />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="font-sans text-sm text-ink-2">{labels.localeLegend}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="inline-flex min-h-11 items-center gap-2">
            <input type="radio" name="locale" value="en" defaultChecked={locale === "en"} className="h-4 w-4 accent-[var(--sutra)]" />
            <span>{labels.localeEn}</span>
          </label>
          <label className="inline-flex min-h-11 items-center gap-2">
            <input type="radio" name="locale" value="hi" defaultChecked={locale === "hi"} className="h-4 w-4 accent-[var(--sutra)]" />
            <span lang="hi">{labels.localeHi}</span>
          </label>
        </div>
      </fieldset>
      {/* Bots fill every field; people never see this one. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          {labels.honeypotLabel}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? labels.submitting : labels.submit}
        </Button>
      </div>
    </form>
  );
}
