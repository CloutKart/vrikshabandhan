"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { revalidateStories } from "@/app/admin/actions";
import { StoryBody } from "@/components/story/StoryBody";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";
import { emptyDraft, parseTags, validateDraft, type Draft, type DraftErrors } from "@/lib/content/admin";
import { slugify } from "@/lib/content/slug";
import { ytId } from "@/lib/content/youtube";
import { browserClient } from "@/lib/supabase/browser";
import { MediaUploader } from "./MediaUploader";

type Props = { id?: string; initial?: Draft; deletedAt?: string | null };

/** Turn a Supabase error into a sentence an editor can act on. */
function explain(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "23505") return "another post already uses this address; change the address field.";
  if (code === "PGRST116") return "the post was not found, or your session has ended. Sign in again and retry.";
  return e instanceof Error ? e.message : "error";
}

/**
 * Create or edit a post. Saves go straight to Supabase under row-level
 * security (the signed-in editor's session), then the public pages are
 * revalidated. Delete is soft and can be undone from the toast.
 */
export function PostEditor({ id, initial, deletedAt }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial ?? emptyDraft());
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  // Uploads are filed under the row id once it exists, so renaming a post never strands its files.
  const uploadFolder = id ?? (draft.slug || slugify(draft.title_en, draft.date));

  /** Revalidation is not part of saving: a post that saved but did not revalidate is still saved. */
  async function revalidate() {
    try {
      await revalidateStories();
    } catch {
      toast("Saved, but the public pages could not be refreshed yet. They refresh on their own within a minute.");
    }
  }

  async function save() {
    const next = { ...draft, tags: parseTags(tagsInput), slug: draft.slug || slugify(draft.title_en, draft.date) };
    const errs = validateDraft(next);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast("Some fields need attention.");
      return;
    }
    const sb = browserClient();
    if (!sb) return;
    setBusy(true);
    let savedId: string | null = null;
    try {
      if (id) {
        // .select().single() makes a silent no-op (expired session, policy) an error instead of a false success.
        const { error } = await sb.from("posts").update(next).eq("id", id).select("id").single();
        if (error) throw error;
        savedId = id;
      } else {
        const { data, error } = await sb.from("posts").insert(next).select("id").single();
        if (error) throw error;
        savedId = data.id;
      }
    } catch (e) {
      toast(`Could not save: ${explain(e)}`);
      setBusy(false);
      return;
    }
    await revalidate();
    toast(next.live ? "Published." : "Saved as a draft.");
    setBusy(false);
    if (id) setDraft(next);
    else router.push(`/admin/posts/${savedId}`);
  }

  async function setDeleted(value: string | null) {
    const sb = browserClient();
    if (!sb || !id) return;
    const { error } = await sb.from("posts").update({ deleted_at: value }).eq("id", id).select("id").single();
    if (error) {
      toast(`Could not change: ${explain(error)}`);
      return;
    }
    await revalidate();
    router.refresh();
  }

  async function remove() {
    await setDeleted(new Date().toISOString());
    toast("Post deleted. Its photos stay in storage.", { label: "Undo", onClick: () => void setDeleted(null) });
  }

  return (
    <main id="content" className="page py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-[2.5rem] leading-tight">{id ? "Edit post" : "New post"}</h1>
        <Link href="/admin" className="u-thread font-sans">
          All posts
        </Link>
      </div>
      {deletedAt ? (
        <p role="alert" className="mt-6 font-sans text-sutra">
          This post is deleted and hidden from the site.{" "}
          <button type="button" className="u-thread" onClick={() => void setDeleted(null)}>
            Restore it
          </button>
        </p>
      ) : null}
      <form
        className="mt-10 grid gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        noValidate
      >
        <div className="grid gap-6 min-[820px]:grid-cols-2">
          <Field id="title_en" label="Title (English)" error={errors.title_en}>
            <input id="title_en" value={draft.title_en} onChange={(e) => set("title_en", e.target.value)} className={inputClass} aria-invalid={Boolean(errors.title_en)} aria-describedby={errors.title_en ? "title_en-error" : undefined} required />
          </Field>
          <Field id="title_hi" label="शीर्षक (हिंदी)" lang="hi">
            <input id="title_hi" lang="hi" value={draft.title_hi} onChange={(e) => set("title_hi", e.target.value)} className={inputClass} />
          </Field>
          <Field id="date" label="Date" error={errors.date}>
            <input id="date" type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} className={inputClass} aria-invalid={Boolean(errors.date)} required />
          </Field>
          <Field id="slug" label="Address (slug)" hint="Part of the story's web address. Left empty, it comes from the English title.">
            <input id="slug" value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value, ""))} className={inputClass} placeholder={slugify(draft.title_en, draft.date)} />
          </Field>
          <Field id="place" label="Place" hint="For example: Dharkot, Dehradun">
            <input id="place" value={draft.place} onChange={(e) => set("place", e.target.value)} className={inputClass} />
          </Field>
          <Field id="tags" label="Tags" hint="Separate with commas: Raksha Bandhan, School drive, Open letter">
            <input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputClass} />
          </Field>
          <Field id="yt" label="YouTube video (optional)" hint="Paste a youtube.com or youtu.be link. The film plays on the story page, below the text." error={errors.yt}>
            <input id="yt" type="url" value={draft.yt} onChange={(e) => set("yt", e.target.value)} className={inputClass} placeholder="https://youtu.be/" aria-invalid={Boolean(errors.yt)} aria-describedby={errors.yt ? "yt-error" : undefined} />
          </Field>
          <Field id="summary_en" label="Summary (English)" hint="One or two lines, shown in the list.">
            <input id="summary_en" value={draft.summary_en} onChange={(e) => set("summary_en", e.target.value)} className={inputClass} />
          </Field>
          <Field id="summary_hi" label="सारांश (हिंदी)" lang="hi">
            <input id="summary_hi" lang="hi" value={draft.summary_hi} onChange={(e) => set("summary_hi", e.target.value)} className={inputClass} />
          </Field>
        </div>

        {ytId(draft.yt) ? (
          <div className="max-w-[36rem]">
            <p className="font-sans text-sm text-ink-2">Video preview</p>
            <div className="mt-2 aspect-video overflow-hidden bg-ground-2">
              <iframe src={`https://www.youtube-nocookie.com/embed/${ytId(draft.yt)}`} title="Video preview" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 min-[820px]:grid-cols-2">
          <Field id="body_en" label="Text (English)" hint='One paragraph per line. Start a line with "## " for a subheading, "> " for a quote, and end a quote with " — Name" to credit it.'>
            <textarea id="body_en" value={draft.body_en} onChange={(e) => set("body_en", e.target.value)} className={`${inputClass} min-h-[18rem] font-serif`} />
          </Field>
          <Field id="body_hi" label="पाठ (हिंदी)" lang="hi" hint="Optional. Leave empty to show the English text on the Hindi page.">
            <textarea id="body_hi" lang="hi" value={draft.body_hi} onChange={(e) => set("body_hi", e.target.value)} className={`${inputClass} min-h-[18rem] font-serif`} />
          </Field>
        </div>

        <div>
          <button type="button" className="u-thread font-sans" onClick={() => setPreview((p) => !p)} aria-expanded={preview} aria-controls="preview">
            {preview ? "Hide preview" : "Preview the text"}
          </button>
          {preview ? (
            <div id="preview" className="paper mt-4 max-w-[calc(65ch+2*clamp(1.25rem,5vw,4rem))]">
              <StoryBody body={draft.body_en} lang="en" />
            </div>
          ) : null}
        </div>

        <MediaUploader items={draft.media} slug={uploadFolder} onChange={(media) => set("media", media)} error={errors.media} />

        <label className="flex items-center gap-3 font-sans">
          <input type="checkbox" checked={draft.live} onChange={(e) => set("live", e.target.checked)} className="h-5 w-5" />
          Published (unchecked means a draft only editors can see)
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving" : draft.live ? "Publish" : "Save draft"}
          </Button>
          {id && !deletedAt ? (
            <Button type="button" variant="line" onClick={() => void remove()} disabled={busy}>
              Delete
            </Button>
          ) : null}
        </div>
      </form>
    </main>
  );
}
