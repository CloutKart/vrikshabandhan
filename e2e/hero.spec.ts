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
