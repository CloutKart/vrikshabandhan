import { expect, test } from "@playwright/test";

test("the hero has one bilingual h1 with a lang on each line", async ({ page }) => {
  await page.goto("/en");
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  await expect(h1.locator('[lang="en"]')).toHaveText("A thread tied to a tree");
  await expect(h1.locator('[lang="hi"]')).toHaveText("पेड़ से बँधा एक धागा");
});

test("the Hindi home page leads with the Hindi line", async ({ page }) => {
  await page.goto("/hi");
  const first = page.locator("h1 > span").first();
  await expect(first).toHaveAttribute("lang", "hi");
});

test("the painting is the priority image and describes itself", async ({ page }) => {
  await page.goto("/en");
  const painting = page.locator('img.hero-painting[data-variant="dark"]');
  // next/image "priority": never lazy, and either a preload link or fetchpriority=high.
  expect(await painting.getAttribute("loading")).not.toBe("lazy");
  const preloads = await page.locator('link[rel="preload"][as="image"][imagesrcset*="tree-painting"]').count();
  const fetchPriority = await painting.getAttribute("fetchpriority");
  expect(preloads > 0 || fetchPriority === "high").toBe(true);
  await expect(painting).toHaveAttribute("alt", /raksha sutra/);
  await expect(page.locator('img.hero-cutout[data-variant="dark"]')).toHaveAttribute("alt", "");
  // The light variants exist for the light theme but are never fetched while hidden.
  await expect(page.locator('img.hero-painting[data-variant="light"]')).toHaveAttribute("loading", "lazy");
  await expect(page.locator('img.hero-painting[data-variant="light"]')).toBeHidden();
});

test("the light theme shows the cream painting and its cut-out, and keeps the depth", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("va-theme", "light"));
  await page.goto("/en");
  await expect(page.locator('img.hero-painting[data-variant="light"]')).toBeVisible();
  await expect(page.locator('img.hero-painting[data-variant="dark"]')).toBeHidden();
  await expect(page.locator('img.hero-cutout[data-variant="light"]')).toBeVisible();
  await expect(page.locator('img.hero-cutout[data-variant="dark"]')).toBeHidden();
  // The headline sits under the leaves: its top is above the canopy's lower edge (about 72% of the art height).
  const art = await page.locator(".hero-art").boundingBox();
  const title = await page.locator("h1").boundingBox();
  expect(title!.y).toBeLessThan(art!.y + art!.height * 0.7);
  expect(title!.width).toBeGreaterThan(art!.width * 0.3);
});

test("the hero calls to action are real links", async ({ page }) => {
  await page.goto("/en");
  const hero = page.locator(".hero");
  await expect(hero.getByRole("link", { name: "Read the stories" })).toHaveAttribute("href", "/en/stories");
  await expect(hero.getByRole("link", { name: "Tie a thread with us" })).toHaveAttribute("href", "/en/get-involved");
});

test("no painting credit is shown while the credit is empty", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("[data-credit]")).toHaveCount(0);
});

test.describe("wide, short screens", () => {
  test.use({ viewport: { width: 2000, height: 960 } });

  test("the painting and the brand share one column, and the lede is in the first screen", async ({ page }) => {
    await page.goto("/en");
    const painting = await page.locator(".hero-art").boundingBox();
    const brand = await page.getByRole("link", { name: /Vrikshabandhan Abhiyan/ }).first().boundingBox();
    expect(painting && brand).toBeTruthy();
    expect(Math.abs(painting!.x - brand!.x), "painting aligns with the brand").toBeLessThanOrEqual(1);
    const pageMax = 2000; // the layout fills the window
    expect(painting!.x + painting!.width, "painting stays inside the column").toBeLessThanOrEqual((2000 - pageMax) / 2 + pageMax + 1);
    expect(await page.locator(".hero-art").evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("24px");
    expect(await page.locator(".hero-art").evaluate((el) => getComputedStyle(el).borderBottomRightRadius)).toBe("24px");
    await expect(page.getByText(/Since 2005 we have planted/)).toBeInViewport();
  });
});

test.describe("latest stories in the hero", () => {
  test("on wide screens the right column holds the three latest stories, once", async ({ page }) => {
    await page.setViewportSize({ width: 2000, height: 960 });
    await page.goto("/en");
    const aside = page.locator(".hero-aside");
    await expect(aside).toBeVisible();
    await expect(aside.locator("[data-story-list] a[href^='/en/stories/']")).toHaveCount(3);
    const art = await page.locator(".hero-art").boundingBox();
    const box = await aside.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(art!.x + art!.width);
    expect(Math.abs(box!.y + box!.height - (art!.y + art!.height))).toBeLessThanOrEqual(8);
    await expect(page.locator("[data-story-list]:visible")).toHaveCount(1);
  });

  test("on narrower screens the list sits below the hero, once", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");
    await expect(page.locator(".hero-aside")).toBeHidden();
    await expect(page.locator("[data-story-list]:visible")).toHaveCount(1);
    const art = await page.locator(".hero-art").boundingBox();
    const list = await page.locator("[data-story-list]:visible").boundingBox();
    expect(list!.y).toBeGreaterThan(art!.y + art!.height);
  });
});
