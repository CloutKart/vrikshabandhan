import type { Locale } from "@/i18n/routing";
import { parseBody } from "@/lib/content/markup";

/** Mini-markup to semantic HTML. Headings are h2: the story title is the page's only h1. */
export function StoryBody({ body, lang }: { body: string; lang: Locale }) {
  const blocks = parseBody(body);
  return (
    <div data-body lang={lang} className="prose prose-lg mt-10 max-w-[65ch]">
      {blocks.map((b, i) => {
        if (b.kind === "heading") return <h2 key={i}>{b.text}</h2>;
        if (b.kind === "quote")
          return (
            <blockquote key={i}>
              <p>{b.text}</p>
              {b.cite ? <cite>{b.cite}</cite> : null}
            </blockquote>
          );
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}
