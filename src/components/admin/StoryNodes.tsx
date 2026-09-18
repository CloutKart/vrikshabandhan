"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { Blockquote } from "@tiptap/extension-blockquote";
import { Heading } from "@tiptap/extension-heading";
import Image from "next/image";
import { createContext, useContext } from "react";
import { mediaUrl } from "@/lib/content/posts";
import type { MediaItem } from "@/lib/content/types";

/** The story's uploads, so a photo placed in the text can show itself and its description. */
export const MediaContext = createContext<MediaItem[]>([]);

/** Every pasted heading becomes a subheading: the story title is the page's only h1. */
export const StoryHeading = Heading.extend({
  parseHTML() {
    return [1, 2, 3, 4, 5, 6].map((level) => ({ tag: `h${level}`, attrs: { level: 2 } }));
  },
}).configure({ levels: [2] });

/** A quote's source, one line under it. Lives only inside a quote. */
export const Citation = Node.create({
  name: "citation",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "cite" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["cite", mergeAttributes(HTMLAttributes), 0];
  },
});

/** A quote: paragraphs, then at most one source line. */
export const StoryBlockquote = Blockquote.extend({
  content: "paragraph+ citation?",
});

function StoryImageView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const media = useContext(MediaContext);
  const path = String(node.attrs.path ?? "");
  const caption = String(node.attrs.caption ?? "");
  const m = media.find((x) => x.path === path && x.type === "image");
  return (
    <NodeViewWrapper as="figure" data-story-figure className="story-node" contentEditable={false}>
      {m ? (
        <div className="framed relative overflow-hidden rounded-[var(--radius-sm)] bg-ground-2" style={{ aspectRatio: m.width && m.height ? `${m.width} / ${m.height}` : "4 / 3" }} data-drag-handle>
          <Image src={mediaUrl(m)} alt={m.alt_en} fill sizes="65ch" className="object-cover" unoptimized />
        </div>
      ) : (
        <p role="alert" className="framed rounded-[var(--radius-sm)] bg-ground-2 p-4 font-sans text-sm text-sutra">
          Missing photo: it was removed from the uploads. Remove it from the text or upload it again.
        </p>
      )}
      <div className="mt-2 flex items-center gap-3">
        <input
          aria-label="Caption"
          value={caption}
          placeholder={m?.alt_en || "Caption (optional)"}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          className="field-input min-h-11 flex-1 rounded-sm border border-moss bg-transparent px-3 font-sans text-sm text-paper-ink placeholder:text-paper-ink-2/70"
        />
        <button type="button" onClick={deleteNode} className="u-thread min-h-11 font-sans text-sm text-sutra">
          Remove
        </button>
      </div>
    </NodeViewWrapper>
  );
}

/** A photo from the story's uploads, placed between paragraphs. */
export const StoryImage = Node.create({
  name: "storyImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { path: { default: "" }, caption: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "figure[data-story-image]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes({ "data-story-image": "" }, HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StoryImageView);
  },
});

function StoryYoutubeView({ node, deleteNode }: NodeViewProps) {
  const id = String(node.attrs.id ?? "");
  const url = String(node.attrs.url ?? "");
  return (
    <NodeViewWrapper as="figure" data-story-film className="story-node" contentEditable={false}>
      <div className="framed relative aspect-video overflow-hidden rounded-[var(--radius-sm)] bg-ground-2" data-drag-handle>
        <Image src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" fill sizes="65ch" className="object-cover" unoptimized />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 font-sans text-sm">
        <span className="truncate text-paper-ink-2">YouTube film: {url}</span>
        <button type="button" onClick={deleteNode} className="u-thread min-h-11 text-sutra">
          Remove
        </button>
      </div>
    </NodeViewWrapper>
  );
}

/** A YouTube film placed in the text; the story page embeds it, the mail links its thumbnail. */
export const StoryYoutube = Node.create({
  name: "storyYoutube",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { url: { default: "" }, id: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "figure[data-story-film]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes({ "data-story-film": "" }, HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StoryYoutubeView);
  },
});
