import { otherLocale, type Locale } from "@/i18n/routing";
import { parseBody, plainText } from "@/lib/content/markup";
import { mediaUrl, pick } from "@/lib/content/posts";
import type { Block, Inline, MediaItem, Post } from "@/lib/content/types";
import { ytId } from "@/lib/content/youtube";
import { formatStoryDate } from "@/lib/i18n/format";
import { absolutise, escapeHtml as esc, withVars } from "./html";
import { PALETTE as C } from "./palette";
import type { MailStrings, Rendered } from "./types";

/**
 * A story as an e-mail: the whole body, readable in the mail, styled like the
 * site's paper sheet with the colours of the light theme. Plain HTML tables
 * and inline styles, because mail clients read nothing else. Pure: no React,
 * no request, no network, so it runs in unit tests and in the send action.
 */
export const UNSUBSCRIBE_URL = "%%UNSUBSCRIBE_URL%%";
export const ONECLICK_URL = "%%ONECLICK_URL%%";
export const EMAIL = "%%EMAIL%%";

const SERIF = "'Tiro Devanagari Hindi', Georgia, 'Times New Roman', serif";
const SANS = "Mukta, system-ui, -apple-system, 'Segoe UI', sans-serif";
const GALLERY_MAX = 6;

type Ctx = { siteUrl: string; strings: MailStrings };

function lineHeight(lang: Locale) {
  return lang === "hi" ? 1.8 : 1.7;
}

function altFor(m: MediaItem, locale: Locale) {
  return locale === "hi" && m.alt_hi ? m.alt_hi : m.alt_en;
}

/** The shared shell: ground, a paper sheet 600 px wide, the letterhead, the content, the footer. */
function shell(locale: Locale, title: string, preheader: string, content: string, footer: string, s: MailStrings): string {
  const [first, second] = [s.brandName, s.brandNameOther];
  const secondLang = locale === "hi" ? "en" : "hi";
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(title)}</title>
<style>
  @media (prefers-color-scheme: dark) { .sheet { background: ${C.paper} !important; color: ${C.paperInk} !important; } }
  @media only screen and (max-width: 640px) { .sheet { width: 100% !important; } .pad { padding: 24px 20px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${C.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ground};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="sheet" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${C.paper};color:${C.paperInk};border-radius:12px;font-family:${SERIF};font-size:18px;line-height:${lineHeight(locale)};">
<tr><td class="pad" style="padding:32px 36px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" aria-hidden="true"><tr>
    <td style="width:14px;height:14px;background:${C.leafGreen};border-radius:14px 0 14px 0;font-size:0;line-height:0;">&nbsp;</td>
    <td style="width:6px;font-size:0;line-height:0;">&nbsp;</td>
    <td style="width:14px;height:14px;background:${C.leafBlue};border-radius:14px 0 14px 0;font-size:0;line-height:0;">&nbsp;</td>
    <td style="width:6px;font-size:0;line-height:0;">&nbsp;</td>
    <td style="width:14px;height:14px;background:${C.leafGold};border-radius:14px 0 14px 0;font-size:0;line-height:0;">&nbsp;</td>
  </tr></table>
  <p style="margin:14px 0 0;font-size:22px;line-height:1.2;">${esc(first)}</p>
  <p lang="${secondLang}" style="margin:2px 0 0;font-size:18px;line-height:1.3;color:${C.paperInk2};">${esc(second)}</p>
  <p style="margin:4px 0 0;font-family:${SANS};font-size:13px;color:${C.paperInk2};">${esc(s.place)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;"><tr>
    <td style="width:8px;height:8px;background:${C.sutra};border-radius:8px;font-size:0;line-height:0;">&nbsp;</td>
    <td style="border-top:2px solid ${C.sutra};font-size:0;line-height:0;">&nbsp;</td>
  </tr></table>
</td></tr>
<tr><td class="pad" style="padding:12px 36px 32px;">
${content}
</td></tr>
<tr><td class="pad" style="padding:0 36px 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.moss};font-size:0;line-height:0;">&nbsp;</td></tr></table>
  <div style="padding-top:16px;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.paperInk2};">
${footer}
  </div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${C.sutra};color:#FFFFFF;font-family:${SANS};font-size:16px;line-height:20px;padding:12px 20px;border-radius:2px;text-decoration:none;">${esc(label)}</a>`;
}

/** A line's runs with their marks, every run escaped. */
function inline(runs: Inline[]): string {
  return runs
    .map((r) => {
      let t = esc(r.text);
      if (r.bold) t = `<strong>${t}</strong>`;
      if (r.italic) t = `<em>${t}</em>`;
      if (r.href) t = `<a href="${esc(r.href)}" style="color:${C.sutra};">${t}</a>`;
      return t;
    })
    .join("");
}

type BodyCtx = { siteUrl: string; locale: Locale; media: MediaItem[]; watch: string };

/** One block of the story as mail HTML. A photo comes from the story's uploads; a film is its thumbnail, linked. */
function block(b: Block, ctx: BodyCtx): string {
  if (b.kind === "heading") return `<h2 style="margin:1.4em 0 0.5em;font-weight:400;font-size:1.6em;line-height:1.2;">${inline(b.inlines)}</h2>`;
  if (b.kind === "quote")
    return `<blockquote style="margin:1.5em 0;padding:0 0 0 16px;border-left:3px solid ${C.sutra};font-style:italic;"><p style="margin:0;">${inline(b.inlines)}</p>${
      b.cite ? `<cite style="display:block;margin-top:0.5em;font-family:${SANS};font-style:normal;font-size:0.8em;color:${C.paperInk2};">${esc(b.cite)}</cite>` : ""
    }</blockquote>`;
  if (b.kind === "list") {
    const tag = b.ordered ? "ol" : "ul";
    return `<${tag} style="margin:0 0 1em;padding-left:1.4em;">${b.items.map((item) => `<li style="margin:0 0 0.35em;">${inline(item)}</li>`).join("")}</${tag}>`;
  }
  if (b.kind === "image") {
    const m = ctx.media.find((x) => x.path === b.path);
    if (!m) return "";
    return `<figure style="margin:1.5em 0;">${image(absolutise(ctx.siteUrl, mediaUrl(m)), altFor(m, ctx.locale), m)}${
      b.caption ? `<figcaption style="margin-top:8px;font-family:${SANS};font-size:14px;color:${C.paperInk2};">${esc(b.caption)}</figcaption>` : ""
    }</figure>`;
  }
  if (b.kind === "youtube") {
    const href = `https://youtu.be/${esc(b.id)}`;
    return `<figure style="margin:1.5em 0;"><a href="${href}" style="text-decoration:none;"><img src="https://img.youtube.com/vi/${esc(b.id)}/hqdefault.jpg" alt="" width="528" height="396" style="display:block;width:100%;height:auto;background:${C.ground};border-radius:4px;"></a><figcaption style="margin-top:8px;font-family:${SANS};font-size:14px;"><a href="${href}" style="color:${C.sutra};">${esc(ctx.watch)}</a></figcaption></figure>`;
  }
  return `<p style="margin:0 0 1em;">${inline(b.inlines)}</p>`;
}

function blocks(text: string, lang: Locale, ctx: BodyCtx): string {
  return parseBody(text)
    .map((b) => block(b, ctx))
    .filter(Boolean)
    .join("\n")
    .replace(/^/, `<div lang="${lang}" style="line-height:${lineHeight(lang)};">`)
    .concat("</div>");
}

/** One block as the plain-text part: marks dropped, links spelt out, lists as lines. */
function blockText(b: Block, ctx: BodyCtx): string {
  const line = (runs: Inline[]) => runs.map((r) => (r.href ? `${r.text} (${r.href})` : r.text)).join("");
  if (b.kind === "heading") return `\n${line(b.inlines)}\n`;
  if (b.kind === "quote") return `> ${line(b.inlines)}${b.cite ? `\n  ${b.cite}` : ""}`;
  if (b.kind === "list") return b.items.map((item, i) => `${b.ordered ? `${i + 1}.` : "-"} ${line(item)}`).join("\n");
  if (b.kind === "image") {
    const m = ctx.media.find((x) => x.path === b.path);
    return m ? `[${b.caption || altFor(m, ctx.locale)}] ${absolutise(ctx.siteUrl, mediaUrl(m))}` : "";
  }
  if (b.kind === "youtube") return `${ctx.watch}: https://youtu.be/${b.id}`;
  return line(b.inlines);
}

function image(url: string, alt: string, m: MediaItem, href?: string): string {
  const size = m.width && m.height ? ` width="528" height="${Math.round((528 * m.height) / m.width)}"` : ` width="528"`;
  const img = `<img src="${esc(url)}" alt="${esc(alt)}"${size} style="display:block;width:100%;height:auto;background:${C.ground};border-radius:4px;">`;
  return href ? `<a href="${esc(href)}" style="text-decoration:none;">${img}</a>` : img;
}

/** The story in one language. Placeholders for the address and the unsubscribe links are filled per recipient. */
export function renderStoryMail(post: Post, locale: Locale, { siteUrl, strings: s }: Ctx): Rendered {
  const other = otherLocale(locale);
  const title = pick(post, "title", locale);
  const summary = pick(post, "summary", locale);
  const body = pick(post, "body", locale);
  const otherTitle = other === "hi" ? post.title_hi : post.title_en;
  const storyUrl = `${siteUrl}/${locale}/stories/${post.slug}`;
  const otherUrl = `${siteUrl}/${other}/stories/${post.slug}`;
  const images = post.media.filter((m) => m.type === "image");
  const cover = images[0];
  const gallery = images.slice(1, 1 + GALLERY_MAX);
  const more = images.length > 1 + GALLERY_MAX;
  const video = ytId(post.yt);
  const dateLine = [formatStoryDate(post.date, locale), post.place].filter(Boolean).join(", ");
  const subject = withVars(s.subject, { title: title.text });
  const firstProse = parseBody(body.text).find((b) => b.kind === "heading" || b.kind === "paragraph" || b.kind === "quote");
  const preheader = (summary.text || (firstProse && "inlines" in firstProse ? plainText(firstProse.inlines) : "") || "").slice(0, 90);

  const parts: string[] = [];
  parts.push(`<p style="margin:0 0 8px;font-family:${SANS};font-size:14px;color:${C.gold};">${esc(dateLine)}</p>`);
  parts.push(`<h1 lang="${title.lang}" style="margin:0;font-weight:400;font-size:28px;line-height:1.15;">${esc(title.text)}</h1>`);
  if (otherTitle) parts.push(`<p lang="${other}" style="margin:6px 0 0;font-size:18px;line-height:1.3;color:${C.paperInk2};">${esc(otherTitle)}</p>`);
  if (cover) parts.push(`<div style="margin:20px 0;">${image(absolutise(siteUrl, mediaUrl(cover)), altFor(cover, locale), cover, storyUrl)}</div>`);
  if (locale === "hi" && body.lang === "en") parts.push(`<p lang="hi" style="margin:16px 0;font-family:${SANS};font-size:14px;color:${C.paperInk2};">${esc(s.onlyEnglish)}</p>`);
  const bodyCtx: BodyCtx = { siteUrl, locale, media: post.media, watch: s.watch };
  parts.push(`<div style="margin-top:20px;">${blocks(body.text, body.lang, bodyCtx)}</div>`);
  if (video) parts.push(`<p style="margin:16px 0 0;"><a href="https://youtu.be/${esc(video)}" style="color:${C.sutra};">${esc(s.watch)}</a></p>`);
  if (gallery.length) {
    parts.push(`<p style="margin:28px 0 8px;font-family:${SANS};font-size:14px;color:${C.paperInk2};">${esc(s.gallery)}</p>`);
    for (const g of gallery) parts.push(`<div style="margin:0 0 12px;">${image(absolutise(siteUrl, mediaUrl(g)), altFor(g, locale), g)}</div>`);
    if (more) parts.push(`<p style="margin:0;"><a href="${esc(storyUrl)}" style="color:${C.sutra};">${esc(s.morePhotos)}</a></p>`);
  }
  parts.push(`<p style="margin:28px 0 0;">${button(storyUrl, s.read)}</p>`);
  parts.push(`<p style="margin:12px 0 0;font-family:${SANS};font-size:14px;"><a href="${esc(otherUrl)}" lang="${other}" style="color:${C.paperInk2};">${esc(s.otherLocale)}</a></p>`);

  const footer = [
    `<p style="margin:0 0 6px;">${esc(withVars(s.why, { email: EMAIL }))}</p>`,
    `<p style="margin:0 0 6px;"><a href="${UNSUBSCRIBE_URL}" style="color:${C.paperInk2};">${esc(s.unsubscribe)}</a></p>`,
    `<p style="margin:0;">${esc(s.rights)}, <a href="mailto:${esc(s.orgEmail)}" style="color:${C.paperInk2};">${esc(s.orgEmail)}</a></p>`,
  ].join("\n");

  const html = shell(locale, subject, preheader, parts.join("\n"), footer, s);
  const text = [
    title.text,
    otherTitle,
    dateLine,
    "",
    ...parseBody(body.text).map((b) => blockText(b, bodyCtx)).filter(Boolean),
    "",
    video ? `${s.watch}: https://youtu.be/${video}` : "",
    `${s.read}: ${storyUrl}`,
    `${s.otherLocale}: ${otherUrl}`,
    "",
    withVars(s.why, { email: EMAIL }),
    `${s.unsubscribe}: ${UNSUBSCRIBE_URL}`,
    `${s.rights}, ${s.orgEmail}`,
  ]
    .filter((l) => l !== undefined && l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return { subject, html, text };
}

/** The confirmation mail: one button. No unsubscribe line, because nothing has been subscribed yet. */
export function renderConfirmMail(locale: Locale, { siteUrl, strings: s, confirmUrl, email }: Ctx & { confirmUrl: string; email: string }): Rendered {
  const text = withVars(s.confirmText, { email });
  const content = [
    `<h1 style="margin:0;font-weight:400;font-size:28px;line-height:1.15;">${esc(s.confirmTitle)}</h1>`,
    `<p style="margin:16px 0 24px;">${esc(text)}</p>`,
    `<p style="margin:0;">${button(confirmUrl, s.confirmCta)}</p>`,
    `<p style="margin:24px 0 0;font-family:${SANS};font-size:14px;color:${C.paperInk2};">${esc(s.confirmIgnore)}</p>`,
  ].join("\n");
  const footer = `<p style="margin:0;">${esc(s.rights)}, <a href="${esc(siteUrl)}" style="color:${C.paperInk2};">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a></p>`;
  return {
    subject: s.confirmSubject,
    html: shell(locale, s.confirmSubject, text, content, footer, s),
    text: [s.confirmTitle, "", text, "", `${s.confirmCta}: ${confirmUrl}`, "", s.confirmIgnore, "", s.rights].join("\n"),
  };
}

/** The reminder for an address that is already on the list, carrying its unsubscribe link. */
export function renderAlreadyMail(locale: Locale, { siteUrl, strings: s, email, unsubscribeUrl }: Ctx & { email: string; unsubscribeUrl: string }): Rendered {
  const text = withVars(s.alreadyText, { email });
  const content = [
    `<h1 style="margin:0;font-weight:400;font-size:28px;line-height:1.15;">${esc(s.alreadySubject)}</h1>`,
    `<p style="margin:16px 0 24px;">${esc(text)}</p>`,
    `<p style="margin:0;">${button(`${siteUrl}/${locale}/stories`, s.read)}</p>`,
  ].join("\n");
  const footer = [
    `<p style="margin:0 0 6px;"><a href="${esc(unsubscribeUrl)}" style="color:${C.paperInk2};">${esc(s.unsubscribe)}</a></p>`,
    `<p style="margin:0;">${esc(s.rights)}</p>`,
  ].join("\n");
  return {
    subject: s.alreadySubject,
    html: shell(locale, s.alreadySubject, text, content, footer, s),
    text: [s.alreadySubject, "", text, "", `${s.unsubscribe}: ${unsubscribeUrl}`, "", s.rights].join("\n"),
  };
}

/** RFC 8058 one-click unsubscribe headers, plus bulk precedence. */
export function buildHeaders(oneClickUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${oneClickUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    Precedence: "bulk",
  };
}
