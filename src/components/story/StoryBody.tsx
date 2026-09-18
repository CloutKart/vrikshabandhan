import Image from "next/image";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { parseBody } from "@/lib/content/markup";
import { mediaUrl } from "@/lib/content/posts";
import type { Inline, MediaItem } from "@/lib/content/types";
import { YouTubeEmbed } from "./StoryMedia";

/** A line's runs as text with its marks; links off the site open in a new tab. */
export function InlineText({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((r, i) => {
        let node: ReactNode = r.text;
        if (r.bold) node = <strong>{node}</strong>;
        if (r.italic) node = <em>{node}</em>;
        if (r.href) {
          const external = /^https?:\/\//.test(r.href);
          node = (
            <a href={r.href} rel={external ? "noopener" : undefined} target={external ? "_blank" : undefined}>
              {node}
            </a>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

type Props = {
  body: string;
  lang: Locale;
  /** The story's uploads, so a photo placed in the text finds its description and size. */
  media?: MediaItem[];
  /** The accessible title given to a film placed in the text. */
  filmTitle?: string;
};

/** The story format to semantic HTML. Headings are h2: the story title is the page's only h1. */
export function StoryBody({ body, lang, media = [], filmTitle = "Video" }: Props) {
  const blocks = parseBody(body);
  return (
    <div data-body lang={lang} className="prose prose-lg mt-10 max-w-[65ch]">
      {blocks.map((b, i) => {
        if (b.kind === "heading")
          return (
            <h2 key={i}>
              <InlineText inlines={b.inlines} />
            </h2>
          );
        if (b.kind === "quote")
          return (
            <blockquote key={i}>
              <p>
                <InlineText inlines={b.inlines} />
              </p>
              {b.cite ? <cite>{b.cite}</cite> : null}
            </blockquote>
          );
        if (b.kind === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag key={i}>
              {b.items.map((item, j) => (
                <li key={j}>
                  <InlineText inlines={item} />
                </li>
              ))}
            </Tag>
          );
        }
        if (b.kind === "image") {
          const m = media.find((x) => x.path === b.path);
          if (!m) return null;
          const alt = lang === "hi" && m.alt_hi ? m.alt_hi : m.alt_en;
          return (
            <figure key={i} data-story-figure>
              <div className="framed relative overflow-hidden rounded-[var(--radius-sm)] bg-ground-2" style={{ aspectRatio: m.width && m.height ? `${m.width} / ${m.height}` : "4 / 3" }}>
                <Image src={mediaUrl(m)} alt={alt} fill sizes="(min-width: 820px) 65ch, 100vw" className="object-cover" />
              </div>
              {b.caption ? <figcaption>{b.caption}</figcaption> : null}
            </figure>
          );
        }
        if (b.kind === "youtube") return <YouTubeEmbed key={i} url={b.url} title={filmTitle} />;
        return (
          <p key={i}>
            <InlineText inlines={b.inlines} />
          </p>
        );
      })}
    </div>
  );
}
