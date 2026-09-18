import { describe, expect, it } from "vitest";
import { builtinPosts } from "@/lib/content/builtin";
import { buildHeaders, EMAIL, ONECLICK_URL, renderAlreadyMail, renderConfirmMail, renderStoryMail, UNSUBSCRIBE_URL } from "@/lib/newsletter/render";
import { mailStrings } from "@/lib/newsletter/strings";
import { PALETTE } from "@/lib/newsletter/palette";

const siteUrl = "https://vrikshabandhanabhiyan.in";
const seed = builtinPosts.find((p) => p.slug === "seed-bombers-2023")!;
const silkyara = builtinPosts.find((p) => p.slug === "silkyara-open-letter")!;
const count = (s: string, needle: string) => s.split(needle).length - 1;

describe("renderStoryMail", () => {
  const en = renderStoryMail(seed, "en", { siteUrl, strings: mailStrings("en") });
  const hi = renderStoryMail(seed, "hi", { siteUrl, strings: mailStrings("hi") });

  it("names the story in the subject and links to it on the site", () => {
    expect(en.subject).toBe("New story: Seed Bombers of Uttarakhand");
    expect(hi.subject).toBe("नई कहानी: उत्तराखंड के सीड बॉम्बर्स");
    expect(en.html).toContain(`href="${siteUrl}/en/stories/seed-bombers-2023"`);
    expect(en.html).toContain(`href="${siteUrl}/hi/stories/seed-bombers-2023"`);
    expect(en.text).toContain(`${siteUrl}/en/stories/seed-bombers-2023`);
  });
  it("carries the whole body as headings, paragraphs and quotes", () => {
    expect(count(en.html, "<h2 ")).toBeGreaterThanOrEqual(2);
    expect(en.html).toContain("Seed Bombers of Uttarakhand is the record of this beginning");
    const s = renderStoryMail(silkyara, "en", { siteUrl, strings: mailStrings("en") });
    expect(count(s.html, "<blockquote")).toBeGreaterThanOrEqual(1);
    expect(s.text).toContain("> ");
  });
  it("marks the language of every fragment and says when Hindi is not there yet", () => {
    expect(hi.html).toContain('<html lang="hi">');
    expect(hi.html).toContain('<div lang="en"');
    expect(hi.html).toContain(mailStrings("hi").onlyEnglish);
    expect(en.html).not.toContain(mailStrings("en").onlyEnglish);
    expect(en.html).toContain('lang="hi"');
  });
  it("uses the cover as an absolute image, links the film, and never embeds it", () => {
    expect(en.html).toContain(`src="${siteUrl}/images/seed-bombers-2023.jpg"`);
    expect(en.html).toContain("https://youtu.be/XTmHXvDXcI0");
    expect(en.html).not.toContain("<iframe");
  });
  it("renders marks, links, lists, photos and films placed in the text", () => {
    expect(en.html).toContain("<strong>2,00,000 seeds</strong>");
    expect(en.html).toContain('href="https://www.un.org/en/observances/environment-day"');
    expect(en.html).toContain("https://img.youtube.com/vi/XTmHXvDXcI0/hqdefault.jpg");
    expect(en.text).toContain("World Environment Day (https://www.un.org/en/observances/environment-day)");
    expect(en.text).toContain("https://youtu.be/XTmHXvDXcI0");
    const rich = {
      ...seed,
      body_en: "Intro with _italic_.\n- One\n- Two\n1. First\n![Tying](media:posts/x/a.jpg)\n![Gone](media:posts/x/missing.jpg)",
      media: [{ path: "posts/x/a.jpg", type: "image" as const, alt_en: "A thread", alt_hi: "", width: 800, height: 600 }],
    };
    const r = renderStoryMail(rich, "en", { siteUrl, strings: mailStrings("en") });
    expect(r.html).toContain("<em>italic</em>");
    expect(count(r.html, "<li ")).toBe(3);
    expect(r.html).toContain("<ol ");
    expect(r.html).toContain("Tying</figcaption>");
    expect(r.html).not.toContain("missing.jpg");
    expect(r.text).toContain("- One\n- Two\n1. First");
  });
  it("keeps the placeholders exactly once each and the headers one-click", () => {
    for (const r of [en, hi]) {
      expect(count(r.html, UNSUBSCRIBE_URL)).toBe(1);
      expect(count(r.html, EMAIL)).toBe(1);
      expect(count(r.text, UNSUBSCRIBE_URL)).toBe(1);
      expect(count(r.text, EMAIL)).toBe(1);
      expect(r.html).not.toContain(ONECLICK_URL);
    }
    const h = buildHeaders("https://x/api/newsletter/unsubscribe?t=abc");
    expect(h["List-Unsubscribe"]).toBe("<https://x/api/newsletter/unsubscribe?t=abc>");
    expect(h["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
  it("follows the copy rules and the light palette, and stays small", () => {
    for (const r of [en, hi]) {
      expect(r.html).not.toContain("—");
      expect(r.html).not.toContain("·");
      expect(r.text).not.toContain("·");
      expect(r.html).toContain(PALETTE.leafGreen);
      expect(r.html).toContain(PALETTE.sutra);
      expect(r.html).not.toContain("var(--");
      expect(r.html).not.toContain("data-reveal");
      expect(Buffer.byteLength(r.html, "utf8")).toBeLessThan(100_000);
    }
  });
  it("escapes what a title could carry", () => {
    const nasty = { ...seed, title_en: `<script>alert("x")</script> & co`, title_hi: "" };
    const r = renderStoryMail(nasty, "en", { siteUrl, strings: mailStrings("en") });
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
  });
  it("leaves absolute media URLs alone", () => {
    const stored = { ...seed, media: [{ path: "posts/x/a.jpg", type: "image" as const, alt_en: "a", alt_hi: "", url: "https://cdn.example.org/a.jpg" }] };
    expect(renderStoryMail(stored, "en", { siteUrl, strings: mailStrings("en") }).html).toContain('src="https://cdn.example.org/a.jpg"');
  });
});

describe("confirm and reminder mails", () => {
  it("say where the button goes and who asked", () => {
    const c = renderConfirmMail("hi", { siteUrl, strings: mailStrings("hi"), confirmUrl: `${siteUrl}/hi/newsletter/confirm?t=abc`, email: "a@b.co" });
    expect(c.html).toContain(`href="${siteUrl}/hi/newsletter/confirm?t=abc"`);
    expect(c.html).toContain("a@b.co");
    expect(c.html).not.toContain("%%");
    expect(c.text).toContain("confirm?t=abc");
    const a = renderAlreadyMail("en", { siteUrl, strings: mailStrings("en"), email: "a@b.co", unsubscribeUrl: `${siteUrl}/en/newsletter/unsubscribe?t=u1` });
    expect(a.html).toContain("unsubscribe?t=u1");
    expect(a.subject).toBe("You are already on the list");
  });
});
