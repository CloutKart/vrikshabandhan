import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { mediaUrl } from "@/lib/content/posts";
import type { MediaItem } from "@/lib/content/types";
import { ytId } from "@/lib/content/youtube";

function altFor(m: MediaItem, locale: Locale) {
  return locale === "hi" && m.alt_hi ? m.alt_hi : m.alt_en;
}

export function StoryCover({ media, locale }: { media: MediaItem; locale: Locale }) {
  const url = mediaUrl(media);
  if (media.type === "video") return <video src={url} controls playsInline className="w-full" />;
  return (
    <div data-reveal="mask" className="framed relative aspect-[16/10] w-full overflow-hidden bg-ground-2">
      <Image src={url} alt={altFor(media, locale)} fill sizes="(min-width: 820px) 72ch, 100vw" className="object-cover" priority />
    </div>
  );
}

export function StoryGallery({ items, locale, title }: { items: MediaItem[]; locale: Locale; title: string }) {
  if (!items.length) return null;
  return (
    <section aria-label={title} className="mt-12 grid gap-6 min-[820px]:grid-cols-2">
      {items.map((m) => (
        <figure key={m.path}>
          {m.type === "video" ? (
            <video src={mediaUrl(m)} controls playsInline className="w-full" />
          ) : (
            <div data-reveal="mask" className="framed relative aspect-[4/3] overflow-hidden bg-ground-2">
              <Image src={mediaUrl(m)} alt={altFor(m, locale)} fill sizes="(min-width: 820px) 36ch, 100vw" className="object-cover" />
            </div>
          )}
          {altFor(m, locale) ? <figcaption className="mt-2 font-sans text-sm text-paper-ink-2">{altFor(m, locale)}</figcaption> : null}
        </figure>
      ))}
    </section>
  );
}

export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const id = ytId(url);
  if (!id) return null;
  return (
    <div className="mt-12 aspect-video w-full overflow-hidden bg-ground-2">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
