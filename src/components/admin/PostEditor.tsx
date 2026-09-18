"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { retryFailedDeliveries, revalidateStories, sendStoryNewsletter } from "@/app/admin/actions";
import { describeSend } from "@/lib/newsletter/report";
import type { SendReport } from "@/lib/newsletter/types";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";
import { emptyDraft, parseTags, savePayload, validateDraft, type Draft, type DraftErrors } from "@/lib/content/admin";
import { slugify } from "@/lib/content/slug";
import { ytId } from "@/lib/content/youtube";
import type { Locale } from "@/i18n/routing";
import { browserClient } from "@/lib/supabase/browser";
import { MediaUploader } from "./MediaUploader";
import { explain } from "@/lib/supabase/explain";
import { clearCopy, copyKey, readCopy, shouldOffer, writeCopy, type DraftCopy } from "@/lib/editor/recovery";

type Props = { id?: string; initial?: Draft; deletedAt?: string | null; updatedAt?: string | null; above?: ReactNode };

/** The document editor arrives after hydration, only here; until then a quiet box holds its place. */
const StoryEditor = dynamic(() => import("./StoryEditor"), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" className="paper min-h-[28rem] rounded-[var(--radius-panel)] font-sans text-sm text-paper-ink-2">
      Loading the editor
    </div>
  ),
});

/**
 * Create or edit a post. Saves go straight to Supabase under row-level
 * security (the signed-in editor's session), then the public pages are
 * revalidated. Delete is soft and can be undone from the toast.
 */
export function PostEditor({ id, initial, deletedAt, updatedAt, above }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial ?? emptyDraft());
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [busy, setBusy] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [recovered, setRecovered] = useState<DraftCopy | null>(null);
  const key = copyKey(id);

  // A copy of unsaved work from this device, offered once when it holds more than the row does.
  useEffect(() => {
    // After the first paint, so the page never blocks on the read and the server render matches.
    const t = setTimeout(() => {
      const copy = readCopy(localStorage, key);
      if (shouldOffer(copy, initial ?? emptyDraft(), updatedAt)) setRecovered(copy);
    }, 0);
    return () => clearTimeout(t);
  }, [key, initial, updatedAt]);

  // Every change is copied to this device two seconds later; a save clears the copy.
  useEffect(() => {
    const t = setTimeout(() => writeCopy(localStorage, key, { ...draft, tags: parseTags(tagsInput) }), 2000);
    return () => clearTimeout(t);
  }, [draft, tagsInput, key]);

  function restore(copy: DraftCopy) {
    setDraft(copy.draft);
    setTagsInput(copy.draft.tags.join(", "));
    setEditorVersion((v) => v + 1);
    setRecovered(null);
  }
  function discard() {
    clearCopy(localStorage, key);
    setRecovered(null);
  }

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

  /** A live save offers the story to the subscribers; the database decides whether it is the first publish. */
  async function notify(postId: string): Promise<SendReport> {
    try {
      return await sendStoryNewsletter(postId);
    } catch (e) {
      return { status: "error", total: 0, sent: 0, failed: 0, reason: explain(e) };
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
        // A deleted post comes back when it is saved, as a draft or live as the checkbox says.
        const { error } = await sb.from("posts").update(savePayload(next, deletedAt ?? null)).eq("id", id).select("id").single();
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
    clearCopy(localStorage, key);
    await revalidate();
    const report = next.live && savedId ? await notify(savedId) : null;
    const retry = report?.status === "partial" && savedId ? { label: "Retry the failed", onClick: () => void retryFailedDeliveries(savedId).then((r) => toast(describeSend(r).replace(/^Published\. /, "Retried. "), undefined, 8000)) } : undefined;
    toast(describeSend(report), retry, report && (report.status === "partial" || report.status === "error") ? 8000 : undefined);
    setBusy(false);
    if (id) {
      setDraft(next);
      router.refresh();
    } else router.push(`/admin/posts/${savedId}`);
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
      {above ? <div className="mt-8">{above}</div> : null}
      {recovered ? (
        <div data-recovery role="status" className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius-panel)] border border-gold px-5 py-4 font-sans text-sm">
          <span>Unsaved changes from {new Date(recovered.savedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} were found on this device.</span>
          <button type="button" className="u-thread min-h-11" onClick={() => restore(recovered)}>
            Restore them
          </button>
          <button type="button" className="u-thread min-h-11 text-ink-2" onClick={discard}>
            Discard
          </button>
        </div>
      ) : null}
      {deletedAt ? (
        <p role="alert" className="mt-6 font-sans text-sutra">
          This post is deleted and hidden from the site. Saving it brings it back.{" "}
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
          <Field id="yt" label="YouTube video (optional)" hint="Optional. A film here plays below the whole text; to place one within the text, use Film in the editor's toolbar." error={errors.yt}>
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

        <div className="grid gap-2">
          <p className="font-sans text-sm text-ink-2">Story text. Write in either language; the other can follow later. Bold, links, lists, photos and films go in from the toolbar.</p>
          <StoryEditor en={draft.body_en} hi={draft.body_hi} media={draft.media} version={editorVersion} onChange={(lang: Locale, text: string) => set(lang === "en" ? "body_en" : "body_hi", text)} />
          {errors.body_en || errors.body_hi ? (
            <p role="alert" className="font-sans text-sm text-sutra">
              {errors.body_en ?? errors.body_hi}
            </p>
          ) : null}
        </div>

        <MediaUploader items={draft.media} slug={uploadFolder} onChange={(media) => set("media", media)} error={errors.media} />

        <label className="flex items-center gap-3 font-sans">
          <input type="checkbox" checked={draft.live} onChange={(e) => set("live", e.target.checked)} className="h-5 w-5" />
          Published (unchecked means a draft only editors can see)
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving" : deletedAt ? (draft.live ? "Restore and publish" : "Restore as draft") : draft.live ? "Publish" : "Save draft"}
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
