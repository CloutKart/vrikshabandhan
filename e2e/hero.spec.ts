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
    const pageMax = 1800;
    expect(painting!.x + painting!.width, "painting stays inside the column").toBeLessThanOrEqual((2000 - pageMax) / 2 + pageMax + 1);
    expect(Math.abs(thread!.x - ((2000 - pageMax) / 2 + 28)), "thread hugs the column, not the window").toBeLessThanOrEqual(2);
    expect(await page.locator(".hero-art").evaluate((el) => getComputedStyle(el).borderBottomLeftRadius)).toBe("24px");
    await expect(page.getByText(/Since 2005 we have planted/)).toBeInViewport();
  });
});
