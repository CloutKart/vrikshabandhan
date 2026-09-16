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
});

test("thread page: prose with a sticky aside beside it on desktop", async ({ page }) => {
  await page.goto("/en/thread");
  const prose = await page.locator("main p").first().boundingBox();
  const aside = await page.locator("[data-aside]").boundingBox();
  expect(aside!.x).toBeGreaterThan(prose!.x + prose!.width - 1);
  await expect(page.locator("[data-aside] [data-pull-quote]")).toHaveCount(1);
  await expect(page.locator("[data-aside] [data-painting-detail]")).toHaveCount(1);
});

test("home: the chapters exist in both locales, each with an action", async ({ page }) => {
  for (const locale of ["en", "hi"]) {
    await page.goto(`/${locale}`);
    for (const name of ["promise", "lineage", "founder", "involve"]) {
      const section = page.locator(`[data-section="${name}"]`);
      await expect(section, `${locale} ${name}`).toBeVisible();
      expect(await section.locator("a[href]").count(), `${locale} ${name} action`).toBeGreaterThan(0);
    }
    await expect(page.locator('[data-section="promise"] [data-painting-detail="knot"]')).toHaveCount(1);
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
