"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { ASK_DWELL_MS } from "@/lib/newsletter/constants";
import type { NewsletterLabels, SubscribeState } from "@/lib/newsletter/types";
import { NEWSLETTER_STORAGE_KEY } from "@/lib/theme/constants";
import { NewsletterForm } from "./NewsletterForm";

type Props = { labels: NewsletterLabels; locale: Locale; action: (prev: SubscribeState, form: FormData) => Promise<SubscribeState> };

/**
 * The one invitation. A native dialog (focus trap, Escape and focus restore
 * come from the platform) that opens once per visitor on a story page, and
 * only after they have read: either they reached the end of the story, or
 * twelve seconds passed with the story scrolled at least two fifths. Never
 * over another dialog, never in a hidden tab, never again once seen.
 */
export function NewsletterAsk({ labels, locale, action }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [sent, setSent] = useState(false);
  const onSent = useCallback(() => setSent(true), []);

  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
    } catch {
      return; // storage blocked: fail closed, never nag
    }
    if (seen) return;
    let reachedEnd = false;
    let scrolled = false;
    let dwelled = false;
    let opened = false;
    const tryOpen = () => {
      if (opened || !ref.current) return;
      if (!(reachedEnd || (dwelled && scrolled))) return;
      if (document.visibilityState !== "visible") return;
      if (document.querySelector("dialog[open]")) return;
      opened = true;
      try {
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, "seen");
      } catch {
        // nothing to remember with; the dialog still opens this once
      }
      ref.current.showModal();
      ref.current.querySelector<HTMLInputElement>('input[type="email"]')?.focus();
    };
    const end = document.querySelector("[data-newsletter-end]");
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        reachedEnd = true;
        tryOpen();
      }
    });
    if (end) io.observe(end);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.4) {
        scrolled = true;
        tryOpen();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = window.setTimeout(() => {
      dwelled = true;
      tryOpen();
    }, ASK_DWELL_MS);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <dialog ref={ref} id="newsletter-ask" className="ask" aria-labelledby="newsletter-ask-title" data-newsletter-ask>
      <h2 id="newsletter-ask-title" className="text-[1.75rem] leading-tight">
        {labels.askTitle}
      </h2>
      <p className="mt-3 max-w-[44ch] text-ink-2">{labels.askText}</p>
      <div className="mt-6">
        <NewsletterForm labels={labels} locale={locale} action={action} onSent={onSent} titleId="newsletter-ask-title" />
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => ref.current?.close()} className="min-h-11 px-3 font-sans text-ink-2 hover:text-ink">
          {sent ? labels.close : labels.notNow}
        </button>
      </div>
    </dialog>
  );
}
