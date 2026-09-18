import { expect, test } from "@playwright/test";

const routes = ["/en", "/hi", "/en/stories", "/hi/stories", "/en/stories/silkyara-open-letter", "/hi/founder", "/en/thread", "/hi/get-involved"];

for (const route of routes) {
  test(`${route} can be found and shared: canonical, hreflang, Open Graph, Twitter`, async ({ page }) => {
    await page.goto(route);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(new RegExp(`^https?://[^/]+${route}$`));
    const path = route.replace(/^\/(en|hi)/, "");
    for (const [lang, prefix] of [["en", "/en"], ["hi", "/hi"], ["x-default", "/en"]]) {
      const href = await page.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute("href");
      expect(href, `${lang} alternate`).toMatch(new RegExp(`^https?://[^/]+${prefix}${path}$`));
    }
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    expect(await page.locator('meta[property="og:image"]').first().getAttribute("content")).toMatch(/^https?:\/\//);
    expect(await page.locator('meta[property="og:locale"]').getAttribute("content")).toBe(route.startsWith("/hi") ? "hi_IN" : "en_IN");
    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe("summary_large_image");
  });
}

test("the story page is an article with structured data and its cover as the share image", async ({ page }) => {
  await page.goto("/en/stories/seed-bombers-2023");
  expect(await page.locator('meta[property="og:type"]').getAttribute("content")).toBe("article");
  expect(await page.locator('meta[property="og:image"]').first().getAttribute("content")).toContain("seed-bombers");
  const scripts = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent || "{}")));
  const article = scripts.find((s) => s["@type"] === "NewsArticle");
  expect(article).toBeTruthy();
  expect(article.headline).toBe("Seed Bombers of Uttarakhand");
  expect(article.inLanguage).toBe("en");
  expect(article.mainEntityOfPage).toMatch(/\/en\/stories\/seed-bombers-2023$/);
  expect(scripts.find((s) => s["@type"] === "Organization")?.sameAs).toHaveLength(3);
});

test("the home page describes the organisation in both names", async ({ page }) => {
  await page.goto("/hi");
  const org = (await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent || "{}")))).find((s) => s["@type"] === "Organization");
  expect(org.name).toBe("वृक्षबंधन अभियान");
  expect(org.alternateName).toContain("Vrikshabandhan Abhiyan");
  expect(org.email).toContain("@");
});

test("the sitemap lists every page in both languages and robots keeps crawlers out of the admin", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const path of ["/en", "/hi", "/en/stories", "/hi/get-involved", "/en/stories/silkyara-open-letter", "/hi/stories/silkyara-open-letter"]) expect(xml).toContain(`${path}</loc>`);
  expect(xml).toContain('hreflang="hi"');
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const text = await robots.text();
  expect(text).toContain("Disallow: /admin");
  expect(text).toContain("Disallow: /api");
  expect(text).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});
