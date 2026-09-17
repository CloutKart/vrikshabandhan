import { expect, test } from "@playwright/test";

test("founder page: portrait, names and a five-step timeline", async ({ page }) => {
  await page.goto("/en/founder");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('img[alt*="Manoj Dhyani"]')).toBeVisible();
  await expect(page.locator("ol[data-timeline] li")).toHaveCount(5);
  await expect(page.locator("ol[data-timeline] time").first()).toHaveText("1994");
});

test("thread page: three paragraphs, four lineage entries, no numbers block yet", async ({ page }) => {
  await page.goto("/en/thread");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("ol[data-lineage] > li")).toHaveCount(4);
  await expect(page.locator("[data-numbers]")).toHaveCount(0);
  const text = await page.locator("main").innerText();
  expect(text).not.toContain("·");
});

test("get involved: three ways with their own mail links, and a letter-style contact panel", async ({ page }) => {
  await page.goto("/en/get-involved");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(4);
  await expect(page.locator("section#contact [data-letter]")).toHaveCount(1);
  await expect(page.locator("main a[href^='tel:']")).toHaveCount(2);
  const adopt = await page.getByRole("link", { name: "Register a tree" }).getAttribute("href");
  expect(adopt).toMatch(/^mailto:.*subject=Register%20a%20tree/);
  const hrefs = await page.locator("main ol a[href^='mailto:']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(new Set(hrefs).size).toBe(3);
  for (const h of hrefs) expect(h).toMatch(/^mailto:VrikshabandhanAbhiyan@gmail\.com\?/);
  const letterMail = await page.locator("[data-letter] a[href^='mailto:']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(letterMail).toEqual(["mailto:VrikshabandhanAbhiyan@gmail.com", "mailto:36chardhamassociates@gmail.com"]);
  const social = await page.locator("[data-letter] a[target='_blank']").evaluateAll((els) => els.map((e) => new URL(e.getAttribute("href")!).hostname));
  expect(social).toEqual(["www.facebook.com", "www.youtube.com", "www.instagram.com"]);
});

test("thread page: the aside sits beside the prose and does not hang far below it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/thread");
  const prose = await page.locator("[data-prose]").boundingBox();
  const aside = await page.locator("[data-aside]").boundingBox();
  expect(aside!.x).toBeGreaterThan(prose!.x + prose!.width - 1);
  // The aside shows the raksha sutra on bark, and never repeats the sentence printed beside it.
  await expect(page.locator("[data-aside] [data-photo='thread'] img")).toHaveAttribute("alt", /raksha sutra/);
  await expect(page.locator("[data-aside] [data-painting-detail]")).toHaveCount(0);
  await expect(page.locator("[data-aside] [data-pull-quote]")).toHaveCount(0);
  expect(aside!.y + aside!.height).toBeLessThan(prose!.y + prose!.height + 160);
});

test("founder page: the pull quote sits under the portrait and the timeline spans the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/founder");
  const portrait = await page.locator('img[alt*="Manoj Dhyani"]').boundingBox();
  const quote = await page.locator("[data-pull-quote]").boundingBox();
  expect(Math.abs(quote!.x - portrait!.x)).toBeLessThan(2);
  expect(quote!.y).toBeGreaterThan(portrait!.y + portrait!.height);
  const timeline = await page.locator("ol[data-timeline]").boundingBox();
  expect(Math.abs(timeline!.x - portrait!.x)).toBeLessThan(2);
  expect(timeline!.width).toBeGreaterThan(portrait!.width * 1.8);
});

test("header: no nav label wraps onto two lines at 1024", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  for (const locale of ["en", "hi"]) {
    await page.goto(`/${locale}`);
    const boxes = await page.locator("header nav a").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    for (const h of boxes) expect(h, `${locale} nav link height`).toBeLessThan(50);
    const mark = await page.locator("header a[href='/" + locale + "'] > span").first().boundingBox();
    expect(mark!.height).toBeLessThan(50);
  }
});

test("get involved on a phone: the e-mail stays inside the letter panel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/get-involved");
  const panel = await page.locator("[data-letter]").boundingBox();
  for (const mail of await page.locator("[data-letter] a[href^='mailto:']").all()) {
    const box = await mail.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(panel!.x + panel!.width);
  }
});

test("chapter actions read at text size, not as captions", async ({ page }) => {
  await page.goto("/en");
  const size = await page
    .locator('[data-section="lineage"] a[href="/en/thread"]')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(18);
});

test("stories index: the first story starts inside the first screen at 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/stories");
  const first = await page.locator("[data-story-list] [data-story-row]").first().boundingBox();
  expect(first!.y).toBeLessThan(880);
  await expect(page.locator("main [data-photo='stream']")).toHaveCount(1);
});

test("on a phone the promise panel is landscape, so the chapter stays short", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const panel = await page.locator('[data-section="promise"] [data-photo="planting"]').boundingBox();
  expect(panel!.height).toBeLessThan(panel!.width);
});

test("home promise panel never outgrows the screen at 1920", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 960 });
  await page.goto("/en");
  const panel = await page.locator('[data-section="promise"] [data-photo="planting"]').boundingBox();
  expect(panel!.height).toBeLessThanOrEqual(960 * 0.8);
});

test("home: the chapters exist in both locales, each with an action", async ({ page }) => {
  for (const locale of ["en", "hi"]) {
    await page.goto(`/${locale}`);
    for (const name of ["promise", "lineage", "founder", "involve"]) {
      const section = page.locator(`[data-section="${name}"]`);
      await expect(section, `${locale} ${name}`).toBeVisible();
      expect(await section.locator("a[href]").count(), `${locale} ${name} action`).toBeGreaterThan(0);
    }
    const photo = page.locator('[data-section="promise"] [data-photo="planting"] img');
    await expect(photo).toHaveCount(1);
    expect((await photo.getAttribute("alt"))?.length ?? 0, `${locale} planting alt`).toBeGreaterThan(10);
    await expect(page.locator("header [data-mark]")).toHaveCount(1);
  }
});

test("story page: the sheet has a letterhead with the back link inside it", async ({ page }) => {
  await page.goto("/en/stories/silkyara-open-letter");
  await expect(page.locator("[data-paper] [data-letterhead] a[href='/en/stories']")).toHaveCount(1);
});

test("every page reachable from the nav exists in both locales", async ({ page }) => {
  for (const locale of ["en", "hi"]) {
    for (const path of ["", "/stories", "/thread", "/founder", "/get-involved"]) {
      const response = await page.goto(`/${locale}${path}`);
      expect(response?.status(), `${locale}${path}`).toBe(200);
      expect(await page.locator('a[href="#"]').count(), `${locale}${path} bare hash`).toBe(0);
    }
  }
});
