"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Field, inputClass } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";
import { mediaUrl } from "@/lib/content/posts";
import type { MediaItem } from "@/lib/content/types";
import { uploadMedia } from "@/lib/supabase/storage";

type Props = { items: MediaItem[]; slug: string; onChange: (items: MediaItem[]) => void; error?: string };

/** Photos and videos for a post. The first item is the cover. Every image needs an English description to go live. */
export function MediaUploader({ items, slug, onChange, error }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);

  async function addFiles(files: File[]) {
    if (!files.length) return;
    setUploading((n) => n + files.length);
    let next = items;
    for (const file of files) {
      try {
        const item = await uploadMedia(file, slug);
        next = [...next, item];
        onChange(next);
      } catch (e) {
        toast(`Upload failed: ${e instanceof Error ? e.message : "error"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const update = (i: number, patch: Partial<MediaItem>) => onChange(items.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const makeCover = (i: number) => onChange([items[i], ...items.filter((_, j) => j !== i)]);
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <fieldset className="grid gap-4">
      <legend className="font-sans text-sm text-ink-2">Photos and videos. The first one is the cover.</legend>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles([...e.dataTransfer.files]);
        }}
        className={`rounded-sm border border-dashed p-6 text-center font-sans text-sm ${dragging ? "border-sutra" : "border-moss"}`}
      >
        <label htmlFor={`${id}-files`} className="cursor-pointer">
          Drop files here or choose files (JPG, PNG, WebP, MP4 up to 20 MB)
        </label>
        <input
          ref={inputRef}
          id={`${id}-files`}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4"
          className="sr-only"
          onChange={(e) => {
            addFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <p role="status" className="mt-2 text-ink-2">
            Uploading {uploading}
          </p>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="font-sans text-sm text-sutra">
          {error}
        </p>
      ) : null}
      <ol className="grid gap-6">
        {items.map((m, i) => (
          <li key={m.path} className="grid gap-4 border-t border-moss/40 pt-4 min-[820px]:grid-cols-[10rem_1fr]">
            <div>
              <div className="relative aspect-[4/3] overflow-hidden bg-ground-2">
                {m.type === "video" ? (
                  <video src={mediaUrl(m)} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <Image src={mediaUrl(m)} alt="" fill sizes="10rem" className="object-cover" unoptimized />
                )}
              </div>
              <p className="mt-2 flex gap-3 font-sans text-sm">
                {i === 0 ? (
                  <span className="text-gold">Cover</span>
                ) : (
                  <button type="button" className="u-thread" onClick={() => makeCover(i)}>
                    Make cover
                  </button>
                )}
                <button type="button" className="u-thread text-sutra" onClick={() => remove(i)}>
                  Remove
                </button>
              </p>
            </div>
            <div className="grid gap-3">
              <Field id={`${id}-alt-en-${i}`} label="Description (English)" hint="What is in the picture, for people who cannot see it.">
                <input id={`${id}-alt-en-${i}`} value={m.alt_en} onChange={(e) => update(i, { alt_en: e.target.value })} className={inputClass} />
              </Field>
              <Field id={`${id}-alt-hi-${i}`} label="विवरण (हिंदी)" lang="hi">
                <input id={`${id}-alt-hi-${i}`} lang="hi" value={m.alt_hi} onChange={(e) => update(i, { alt_hi: e.target.value })} className={inputClass} />
              </Field>
            </div>
          </li>
        ))}
      </ol>
    </fieldset>
  );
}
