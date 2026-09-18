import { afterEach, describe, expect, it } from "vitest";
import { builtinPosts } from "@/lib/content/builtin";
import { pageAlternates, sitemapEntries, STATIC_PATHS } from "@/lib/seo";
import { absoluteUrl, siteUrl } from "@/lib/site";

describe("site URL", () => {
  const saved = { SITE_URL: process.env.SITE_URL, VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL };
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  });
  it("prefers SITE_URL, then Vercel's production URL, then localhost", () => {
    process.env.SITE_URL = "https://vrikshabandhanabhiyan.in/";
    expect(siteUrl()).toBe("https://vrikshabandhanabhiyan.in");
    delete process.env.SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "vrikshabandhan.vercel.app";
    expect(siteUrl()).toBe("https://vrikshabandhan.vercel.app");
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(siteUrl()).toMatch(/^http:\/\/localhost:\d+$/);
  });
  it("makes paths absolute and leaves URLs alone", () => {
    process.env.SITE_URL = "https://example.org";
    expect(absoluteUrl("/images/og.jpg")).toBe("https://example.org/images/og.jpg");
    expect(absoluteUrl("https://cdn.example.org/a.jpg")).toBe("https://cdn.example.org/a.jpg");
  });
});

describe("alternates", () => {
  it("pair every page with its twin and point x-default at English", () => {
    expect(pageAlternates("hi", "/stories")).toEqual({
      canonical: "/hi/stories",
      languages: { en: "/en/stories", hi: "/hi/stories", "x-default": "/en/stories" },
    });
    expect(pageAlternates("en")).toMatchObject({ canonical: "/en" });
  });
});

describe("sitemap", () => {
  const entries = sitemapEntries("https://example.org", builtinPosts);
  it("lists the static routes and every story in both languages", () => {
    const urls = entries.map((e) => e.url);
    expect(urls).toHaveLength(STATIC_PATHS.length * 2 + builtinPosts.length * 2);
    expect(urls).toContain("https://example.org/en");
    expect(urls).toContain("https://example.org/hi/get-involved");
    expect(urls).toContain("https://example.org/en/stories/silkyara-open-letter");
    expect(urls).toContain("https://example.org/hi/stories/silkyara-open-letter");
  });
  it("names the other language on every entry", () => {
    const story = entries.find((e) => e.url.endsWith("/hi/stories/seed-bombers-2023"))!;
    expect(story.alternates?.languages).toEqual({
      en: "https://example.org/en/stories/seed-bombers-2023",
      hi: "https://example.org/hi/stories/seed-bombers-2023",
    });
    expect(story.lastModified).toBeInstanceOf(Date);
  });
});
