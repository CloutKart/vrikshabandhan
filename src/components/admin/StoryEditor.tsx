"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { CharacterCount, Placeholder, TrailingNode } from "@tiptap/extensions";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";
import type { Locale } from "@/i18n/routing";
import { parseBody, serializeBody } from "@/lib/content/markup";
import { mediaUrl } from "@/lib/content/posts";
import type { MediaItem } from "@/lib/content/types";
import { ytId } from "@/lib/content/youtube";
import { blocksToDoc, docToBlocks, type DocNode } from "@/lib/editor/doc";
import { Citation, MediaContext, StoryBlockquote, StoryHeading, StoryImage, StoryYoutube } from "./StoryNodes";

type Props = {
  en: string;
  hi: string;
  media: MediaItem[];
  /** Bump to reload both texts from the props (after a restore); otherwise the editor owns them after mount. */
  version?: number;
  onChange: (lang: Locale, text: string) => void;
};

const LANG_LABEL: Record<Locale, string> = { en: "English", hi: "हिंदी" };
const PLACEHOLDER: Record<Locale, string> = { en: "Write the story. One idea per paragraph.", hi: "कहानी लिखें। हर अनुच्छेद में एक बात।" };

const toDoc = (text: string): DocNode => blocksToDoc(parseBody(text));
/** A line that carries any of the story format's markers. */
const STORY_MARKUP = /(^|\n)(## |> |- |\d+\. |!\[|@youtube\()|\*\*|\[[^\]]+\]\(/;
const toText = (editor: Editor): string => serializeBody(docToBlocks(editor.getJSON() as DocNode));

function editorAttributes(lang: Locale) {
  return {
    class: "prose prose-lg max-w-none min-h-[24rem] outline-none",
    role: "textbox",
    "aria-multiline": "true",
    "aria-label": `Story text, ${LANG_LABEL[lang]}`,
    lang,
  };
}

/**
 * The story's text as a document: one page-like sheet, a language switch above
 * it, a toolbar of the formatting the story format can hold. Reads and writes
 * the plain-text story format through the block mapping, so nothing else on
 * the site changes for it. Loaded only in the admin, after hydration.
 */
export default function StoryEditor({ en, hi, media, version = 0, onChange }: Props) {
  const [lang, setLang] = useState<Locale>("en");
  // The two documents: the editor shows one and keeps the other here, swapping on the language switch.
  const [initial] = useState<Record<Locale, DocNode>>(() => ({ en: toDoc(en), hi: toDoc(hi) }));
  const docs = useRef<Record<Locale, DocNode>>(initial);
  const langRef = useRef<Locale>("en");
  const editorRef = useRef<Editor | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkDialog = useRef<HTMLDialogElement>(null);
  const filmDialog = useRef<HTMLDialogElement>(null);
  const photoDialog = useRef<HTMLDialogElement>(null);
  const [linkValue, setLinkValue] = useState("");
  const [filmValue, setFilmValue] = useState("");
  const [filmError, setFilmError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        hardBreak: false,
        link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: "https" },
      }),
      StoryHeading,
      StoryBlockquote,
      Citation,
      StoryImage,
      StoryYoutube,
      CharacterCount,
      TrailingNode,
      Placeholder.configure({
        showOnlyCurrent: false,
        includeChildren: true,
        // Read from the ref, not the sheet's lang attribute: decorations are computed before the view applies new attributes.
        placeholder: ({ node }) => (node.type.name === "citation" ? "Who said this" : PLACEHOLDER[langRef.current]),
      }),
    ],
    content: initial.en,
    editorProps: {
      attributes: () => editorAttributes(langRef.current),
      handlePaste: (_view, event) => {
        const data = event.clipboardData;
        if (data?.files.length) {
          toast("Photos go through the uploads below, so they get a description and a place in the gallery.");
          return true;
        }
        // Plain text written in the story format (from a handover file, a note, an older post) becomes real
        // blocks; a single ordinary line stays a plain insertion. Rich pastes (Word, Docs) keep their own path.
        const text = data?.getData("text/plain") ?? "";
        if (!data?.getData("text/html") && text && (text.includes("\n") || STORY_MARKUP.test(text))) {
          const doc = blocksToDoc(parseBody(text));
          editorRef.current?.chain().focus().insertContent(doc.content ?? []).run();
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        if (event.dataTransfer?.files.length) {
          toast("Photos go through the uploads below, so they get a description and a place in the gallery.");
          return true;
        }
        return false;
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          openLink();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (pending.current) clearTimeout(pending.current);
      // The language from the ref, never from a render's closure: a switch changes it before React re-renders.
      const target = langRef.current;
      pending.current = setTimeout(() => {
        pending.current = null;
        onChange(target, toText(ed));
      }, 300);
    },
  });

  editorRef.current = editor;

  /** Write the current language back now, ahead of a switch or a reload. */
  function flush() {
    if (!editor) return;
    const current = langRef.current;
    if (pending.current) {
      clearTimeout(pending.current);
      pending.current = null;
      onChange(current, toText(editor));
    }
    docs.current[current] = editor.getJSON() as DocNode;
  }

  function switchTo(next: Locale) {
    if (!editor || next === lang) return;
    flush();
    setLang(next);
    langRef.current = next;
    // setContent dispatches a transaction, and the view re-reads the attributes (lang, label) with it.
    editor.commands.setContent(docs.current[next], { emitUpdate: false });
  }

  // A restore replaces both texts; the editor reloads them from the props.
  const loaded = useRef(version);
  useEffect(() => {
    if (!editor || loaded.current === version) return;
    loaded.current = version;
    docs.current = { en: toDoc(en), hi: toDoc(hi) };
    editor.commands.setContent(docs.current[lang], { emitUpdate: false });
  }, [editor, version, en, hi, lang]);

  useEffect(() => () => {
    if (pending.current) clearTimeout(pending.current);
  }, []);

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed?.isActive("bold") ?? false,
      italic: ed?.isActive("italic") ?? false,
      heading: ed?.isActive("heading") ?? false,
      quote: ed?.isActive("blockquote") ?? false,
      bullets: ed?.isActive("bulletList") ?? false,
      numbers: ed?.isActive("orderedList") ?? false,
      link: ed?.isActive("link") ?? false,
      canUndo: ed?.can().undo() ?? false,
      canRedo: ed?.can().redo() ?? false,
      words: ed?.storage.characterCount.words() ?? 0,
    }),
  });

  function openLink() {
    if (!editor) return;
    setLinkValue(String(editor.getAttributes("link").href ?? ""));
    linkDialog.current?.showModal();
  }
  function submitLink(e: FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const href = linkValue.trim();
    if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    else editor.chain().focus().extendMarkRange("link").unsetLink().run();
    linkDialog.current?.close();
  }
  function submitFilm(e: FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const url = filmValue.trim();
    const id = ytId(url);
    if (!id) {
      setFilmError("Paste a youtube.com or youtu.be link to the video.");
      return;
    }
    editor.chain().focus().insertContent({ type: "storyYoutube", attrs: { url, id } }).run();
    setFilmValue("");
    setFilmError("");
    filmDialog.current?.close();
  }
  function insertPhoto(m: MediaItem) {
    editor?.chain().focus().insertContent({ type: "storyImage", attrs: { path: m.path, caption: "" } }).run();
    photoDialog.current?.close();
  }
  /** A source line at the end of the quote the cursor is in, or the cursor moved into the one it has. */
  function addSource() {
    if (!editor) return;
    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name !== "blockquote") continue;
      const start = $from.before(depth);
      const end = start + node.nodeSize - 1;
      const last = node.lastChild;
      if (last?.type.name === "citation") {
        editor.chain().focus().setTextSelection(end - 1).run();
        return;
      }
      editor.chain().focus().insertContentAt(end, { type: "citation" }).setTextSelection(end + 1).run();
      return;
    }
    editor.chain().focus().toggleBlockquote().run();
    if (editor.isActive("blockquote")) addSource();
  }

  /** Arrow keys move along the toolbar, as a toolbar should. */
  function toolbarKeys(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    buttons[(at + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length].focus();
  }

  const photos = media.filter((m) => m.type === "image");
  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => () => editor && fn(editor.chain().focus()).run();

  return (
    <MediaContext.Provider value={media}>
      <div data-story-editor className="story-editor grid gap-3">
        <div role="tablist" aria-label="Language of the text" className="flex gap-2 font-sans text-sm">
          {(["en", "hi"] as Locale[]).map((l) => (
            <button key={l} type="button" role="tab" aria-selected={lang === l} lang={l} onClick={() => switchTo(l)} className={`min-h-11 rounded-sm border px-4 ${lang === l ? "border-ink bg-ground-2 text-ink" : "border-moss text-ink-2 hover:text-ink"}`}>
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
        <div className="paper rounded-[var(--radius-panel)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold">
          <div role="toolbar" aria-label="Formatting" aria-controls="story-text" onKeyDown={toolbarKeys} className="sticky top-0 z-10 -mx-2 mb-6 flex flex-wrap items-center gap-1 border-b border-moss/40 bg-paper px-2 py-2 font-sans text-sm">
            <Tool label="Bold" pressed={state?.bold} shortcut="Ctrl+B" onClick={run((c) => c.toggleBold())} />
            <Tool label="Italic" pressed={state?.italic} shortcut="Ctrl+I" onClick={run((c) => c.toggleItalic())} />
            <Tool label="Subheading" pressed={state?.heading} onClick={run((c) => c.toggleHeading({ level: 2 }))} />
            <Tool label="Quote" pressed={state?.quote} onClick={run((c) => c.toggleBlockquote())} />
            <Tool label="Source" onClick={addSource} />
            <Tool label="Bullets" pressed={state?.bullets} onClick={run((c) => c.toggleBulletList())} />
            <Tool label="Numbers" pressed={state?.numbers} onClick={run((c) => c.toggleOrderedList())} />
            <Tool label="Link" pressed={state?.link} shortcut="Ctrl+K" onClick={openLink} />
            <Tool label="Photo" onClick={() => photoDialog.current?.showModal()} />
            <Tool label="Film" onClick={() => filmDialog.current?.showModal()} />
            <span className="mx-1 h-6 w-px bg-moss/40" aria-hidden="true" />
            <Tool label="Undo" shortcut="Ctrl+Z" onClick={run((c) => c.undo())} disabled={!state?.canUndo} />
            <Tool label="Redo" shortcut="Ctrl+Shift+Z" onClick={run((c) => c.redo())} disabled={!state?.canRedo} />
            <span data-word-count className="ml-auto pr-2 text-paper-ink-2">
              {state?.words ?? 0} word{state?.words === 1 ? "" : "s"}
            </span>
          </div>
          <div id="story-text">
            <EditorContent editor={editor} />
          </div>
        </div>

        <dialog ref={linkDialog} className="ask" aria-labelledby="link-title">
          <form onSubmit={submitLink} className="grid gap-4">
            <p id="link-title" className="text-xl">
              Link
            </p>
            <label htmlFor="link-href" className="font-sans text-sm text-ink-2">
              Web address (leave empty to remove the link)
            </label>
            <input id="link-href" type="url" value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder="https://" className={inputClass} autoFocus />
            <div className="flex gap-3">
              <Button type="submit">Apply</Button>
              <Button type="button" variant="line" onClick={() => linkDialog.current?.close()}>
                Cancel
              </Button>
            </div>
          </form>
        </dialog>

        <dialog ref={filmDialog} className="ask" aria-labelledby="film-title">
          <form onSubmit={submitFilm} className="grid gap-4" noValidate>
            <p id="film-title" className="text-xl">
              Film
            </p>
            <label htmlFor="film-url" className="font-sans text-sm text-ink-2">
              YouTube link
            </label>
            <input id="film-url" type="url" value={filmValue} onChange={(e) => setFilmValue(e.target.value)} placeholder="https://youtu.be/" className={inputClass} aria-invalid={Boolean(filmError)} aria-describedby={filmError ? "film-error" : undefined} autoFocus />
            {filmError ? (
              <p id="film-error" role="alert" className="font-sans text-sm text-sutra">
                {filmError}
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button type="submit">Place the film</Button>
              <Button type="button" variant="line" onClick={() => filmDialog.current?.close()}>
                Cancel
              </Button>
            </div>
          </form>
        </dialog>

        <dialog ref={photoDialog} className="ask" aria-labelledby="photo-title">
          <div className="grid gap-4">
            <p id="photo-title" className="text-xl">
              Place a photo
            </p>
            {photos.length ? (
              <ul className="grid max-h-[60vh] gap-3 overflow-y-auto">
                {photos.map((m) => (
                  <li key={m.path}>
                    <button type="button" onClick={() => insertPhoto(m)} className="grid w-full grid-cols-[6rem_1fr] items-center gap-3 rounded-sm border border-moss p-2 text-left hover:border-ink">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(m)} alt="" className="aspect-[4/3] w-full rounded-sm object-cover" />
                      <span className="font-sans text-sm">{m.alt_en || "(no description yet)"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-sm text-ink-2">No photos uploaded yet. Add them under Photos and videos below, then place them here.</p>
            )}
            <div>
              <Button type="button" variant="line" onClick={() => photoDialog.current?.close()}>
                Close
              </Button>
            </div>
          </div>
        </dialog>
      </div>
    </MediaContext.Provider>
  );
}

function Tool({ label, pressed, shortcut, onClick, disabled, children }: { label: string; pressed?: boolean; shortcut?: string; onClick: () => void; disabled?: boolean; children?: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      disabled={disabled}
      // Pressing a tool must not take the selection away from the sheet, or there is nothing to format.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-h-11 min-w-11 rounded-sm px-3 text-paper-ink transition-colors duration-150 hover:bg-ground-2/60 disabled:opacity-40 aria-pressed:bg-paper-ink aria-pressed:text-paper ${pressed ? "" : ""}`}
    >
      {children ?? label}
    </button>
  );
}
