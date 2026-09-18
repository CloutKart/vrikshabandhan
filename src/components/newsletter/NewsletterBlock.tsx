import { getTranslations } from "next-intl/server";
import { subscribe } from "@/app/[locale]/newsletter/actions";
import type { Locale } from "@/i18n/routing";
import { newsletterLabels } from "@/lib/newsletter/strings";
import { NewsletterForm } from "./NewsletterForm";

type Props = { locale: Locale; variant: "footer" | "panel" };

/**
 * The plain subscribe form, in the footer of every page and as a paper panel
 * on the stories page. The title is a paragraph, not a heading, so page
 * outlines stay as they are.
 */
export async function NewsletterBlock({ locale, variant }: Props) {
  const t = await getTranslations({ locale, namespace: "newsletter" });
  const labels = newsletterLabels(t);
  const titleId = `newsletter-${variant}-title`;
  if (variant === "panel") {
    return (
      <section data-newsletter={variant} aria-labelledby={titleId} className="paper mt-16 rounded-[var(--radius-panel)]">
        <p id={titleId} className="text-[1.5rem] leading-tight text-paper-ink">
          {labels.footerTitle}
        </p>
        <p className="mt-2 max-w-[44ch] text-paper-ink-2">{labels.footerText}</p>
        <div className="mt-6 max-w-[36rem] [--ground-2:var(--paper)] [--ink:var(--paper-ink)] [--ink-2:var(--paper-ink-2)]">
          <NewsletterForm labels={labels} locale={locale} action={subscribe} titleId={titleId} />
        </div>
      </section>
    );
  }
  return (
    <div data-newsletter={variant} className="max-w-[36rem] min-[820px]:col-span-3">
      <p id={titleId} className="text-ink">
        {labels.footerTitle}
      </p>
      <p className="mt-1">{labels.footerText}</p>
      <div className="mt-4">
        <NewsletterForm labels={labels} locale={locale} action={subscribe} titleId={titleId} />
      </div>
    </div>
  );
}
