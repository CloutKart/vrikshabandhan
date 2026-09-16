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
  const painting = page.locator('img[src*="tree-painting"]');
  // next/image "priority": never lazy, and either a preload link or fetchpriority=high.
  expect(await painting.getAttribute("loading")).not.toBe("lazy");
  const preloads = await page.locator('link[rel="preload"][as="image"][imagesrcset*="tree-painting"]').count();
  const fetchPriority = await painting.getAttribute("fetchpriority");
  expect(preloads > 0 || fetchPriority === "high").toBe(true);
  await expect(painting).toHaveAttribute("alt", /raksha sutra/);
  await expect(page.locator('img[src*="tree-cutout"]')).toHaveAttribute("alt", "");
});

test("the hero calls to action are real links", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: "Read the stories" })).toHaveAttribute("href", "/en/stories");
  await expect(page.getByRole("link", { name: "Tie a thread with us" })).toHaveAttribute("href", "/en/get-involved");
});

test("no painting credit is shown while the credit is empty", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("[data-credit]")).toHaveCount(0);
});

test.describe("wide, short screens", () => {
  test.use({ viewport: { width: 2000, height: 960 } });

  test("the painting, the brand and the thread share one column, and the lede is in the first screen", async ({ page }) => {
    await page.goto("/en");
    const painting = await page.locator(".hero-art").boundingBox();
    const brand = await page.getByRole("link", { name: /Vrikshabandhan Abhiyan/ }).first().boundingBox();
    const thread = await page.locator("[data-thread]").boundingBox();
    expect(painting && brand && thread).toBeTruthy();
    expect(Math.abs(painting!.x - brand!.x), "painting aligns with the brand").toBeLessThanOrEqual(1);
    const pageMax = 2000; // the layout fills the window
    expect(painting!.x + painting!.width, "painting stays inside the column").toBeLessThanOrEqual((2000 - pageMax) / 2 + pageMax + 1);
    expect(Math.abs(thread!.x + thread!.width / 2 - ((2000 - pageMax) / 2 + 28)), "thread hugs the column, not the window").toBeLessThanOrEqual(2);
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
