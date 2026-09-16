/** A quotation on paper: the site's device for anything that is a document. */
export function PullQuote({ quote, cite, lang, className = "" }: { quote: string; cite?: string; lang: string; className?: string }) {
  return (
    <figure data-pull-quote className={`paper rounded-[var(--radius-panel)] ${className}`}>
      <blockquote lang={lang} className="text-[clamp(1.5rem,2.2vw,2.1rem)] leading-[1.3]">
        <p>{quote}</p>
      </blockquote>
      {cite ? <figcaption className="mt-5 font-sans text-sm text-paper-ink-2">{cite}</figcaption> : null}
    </figure>
  );
}
