# A document editor for stories

Date: 2026-09-18. Status: approved, being built.

## Why

The story editor was a plain text box with three line rules. The Abhiyan's writers want writing to feel like a
document: formatting they can see, pasting from Word or Google Docs, photos and films placed where they belong in
the text, and no lost work. This spec records the design decided with the owner.

Decisions taken: bold and italic, links, bulleted and numbered lists, photos inside the text, YouTube films inside
the text; writers both paste and write directly, in Hindi and English; one page-like writing area with a language
switch; unsaved work recovered after a closed tab. The editor is a real document editor (Tiptap 3 on ProseMirror)
that saves an extended plain-text format, so every existing story stays valid, nothing but text reaches the
database, and the site and the mail keep one parser.

## The story format

One block per line, as before. Leading and trailing spaces on a line are ignored; blank lines are ignored.

| Line | Block |
|---|---|
| `## text` | subheading (h2) |
| `> text — Name` | quote, the source after the last ` — ` optional |
| `- item` on consecutive lines | bulleted list |
| `1. item` on consecutive lines (any numbers) | numbered list |
| `![caption](media:posts/x/y.jpg)` | a photo from the story's uploads, caption optional |
| `@youtube(https://youtu.be/…)` | a film: embedded on the site, a linked thumbnail in mail |
| anything else | paragraph |

Inline, inside any text run: `**bold**`, `_italic_`, `[text](https://…)`. Bold and italic are independent
toggles, so they nest in any order. A backslash escapes the next character. The serializer escapes `\`, `*`, `_`,
`[` and `]` everywhere, and `#`, `>`, `-`, `!`, `@` and a list number at the start of a line, so any text survives
a round trip. A single `*` is never markup. The existing stories contain none of these characters and parse as
before.

Blocks:

```
Inline = { text; bold?; italic?; href? }
Block  = heading | paragraph | quote (cite?)   each with text (plain) and inlines
       | list { ordered; items: Inline[][] }
       | image { path; caption }
       | youtube { url; id }
```

`text` stays on the three prose blocks (marks stripped) for the mail preheader, the structured data and any older
caller. `parseBody`, `parseInline`, `serializeBody`, `serializeInline` and `plainText` live in
`src/lib/content/markup.ts` and are pure.

## The editor

`src/components/admin/StoryEditor.tsx`, loaded with `next/dynamic` and `ssr: false`, so the public bundle never
carries it. One Tiptap instance, a language switch above it (English / हिंदी, a tablist), the other language's
document kept in state. The content area carries `lang`. A sticky toolbar: Bold, Italic, Subheading, Quote,
Source (inside a quote), Bullets, Numbers, Link, Photo, Film, Undo, Redo, with a word count on the right. Real
buttons with `aria-label` and `aria-pressed`, 44 px targets, the shortcuts Ctrl/Cmd+B, I, Z, Shift+Z and Ctrl+K.
The link and film dialogs are native `<dialog>` elements; the photo picker lists the story's uploaded images with
their descriptions and points at the uploads for new ones. The sheet uses the `paper` and `prose` classes so the
writer sees what readers will see. A film shows as its thumbnail in the editor, never an iframe.

`src/lib/editor/doc.ts` maps Tiptap's JSON document to blocks and back, pure and unit tested. A paste from Word
arrives as HTML that ProseMirror reduces to the schema (fonts, colours, sizes fall away); `docToBlocks` drops
what the format cannot hold, so what the writer sees after a paste is what is saved.

`PostEditor` keeps `body_en` and `body_hi` in the text format, written back on every change; save, validation,
the newsletter hook and delete are unchanged. The `yt` field stays for stories that use it.

## Recovering unsaved work

Every two seconds after a change the draft is copied to `localStorage["va-draft-<id or new>"]` with a timestamp,
in try/catch. On open, a copy newer than the row and different from it shows a bar with Restore and Discard. A
successful save clears the copy. Nothing leaves the browser.

## Rendering

The story page renders marks as `strong`, `em` and `a` (external links `rel="noopener" target="_blank"`), lists,
photos as framed figures with captions through `mediaUrl()` (a path no longer among the uploads renders
nothing) and films through the existing embed. The mail renders the same blocks with inline styles, photos at
reading width with captions, and a film as its YouTube thumbnail linked to the video; the text part writes
`*bold*`, `- item`, captions and links. Every run is escaped.

## Edge cases

A photo removed from the uploads but still in the text shows as "Missing photo" and blocks publishing with a
message. A film link the id helper rejects is refused at insertion. A pasted bare URL becomes a link. Pasted
image files are refused with a pointer to the uploads. While the editor loads, the text box shows read-only.

## Out of scope

Tables, colours, font sizes, alignment, footnotes, comments and tracked changes, images pasted from the clipboard,
a second cover, editing the built-in stories.
