import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the hero shows its final state immediately and nothing is marked pending", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).not.toHaveAttribute("data-hero", /.+/);
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "full");
    await expect(page.locator("h1")).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero-cutout")).toHaveCSS("opacity", "1");
  });

  test("page titles and images are never hidden", async ({ page }) => {
    await page.goto("/en/founder");
    await expect(page.locator("h1")).toHaveCSS("opacity", "1");
    await expect(page.locator('img[alt*="Manoj Dhyani"]')).toBeVisible();
  });
});

test.describe("full motion", () => {
  test("the hero plays once per session, then leaves the heading intact", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
    await expect(page.locator("html")).not.toHaveAttribute("data-hero", /.+/, { timeout: 2500 });
    await expect(page.locator("h1")).toHaveCSS("opacity", "1");
    await expect(page.locator("h1 [lang='en']")).toHaveText("A thread tied to a tree");
    expect(await page.locator("h1 [aria-hidden]").count()).toBe(0);
    expect(await page.evaluate(() => sessionStorage.getItem("va-hero"))).toBeTruthy();
    await page.reload();
    await expect(page.locator("html")).not.toHaveAttribute("data-hero", /.+/);
  });

  test("page titles arrive as words and end as plain text", async ({ page }) => {
    await page.goto("/en/stories");
    const title = page.locator("[data-title-reveal]").first();
    await expect(title).toHaveAttribute("data-title-done", "", { timeout: 2500 });
    await expect(title).toHaveText("Stories from the field");
    // The split wrappers are reverted when the words finish rising.
    await expect.poll(() => title.locator("[aria-hidden]").count(), { timeout: 2500 }).toBe(0);
  });

  test("the knot follows the scroll", async ({ page }) => {
    await page.goto("/en/stories");
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "", { timeout: 5000 });
    const knot = page.locator("[data-knot]");
    const before = await knot.evaluate((el) => getComputedStyle(el).transform);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await expect.poll(async () => knot.evaluate((el) => getComputedStyle(el).transform), { timeout: 3000 }).not.toBe(before);
  });

  test("the knot slides to the story row under the pointer", async ({ page }) => {
    await page.goto("/en/stories");
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "", { timeout: 5000 });
    const dot = page.locator("[data-knot-dot]");
    await page.mouse.move(5, 5);
    await page.locator("[data-story-row]").nth(2).hover();
    await expect.poll(async () => dot.evaluate((el) => getComputedStyle(el).transform), { timeout: 3000 }).not.toBe("none");
  });

  test("images and the timeline reveal once they enter the viewport", async ({ page }) => {
    await page.goto("/en/founder");
    await expect(page.locator("[data-reveal='mask']").first()).toHaveAttribute("data-revealed", "", { timeout: 3000 });
    await page.locator("ol[data-timeline]").scrollIntoViewIfNeeded();
    await expect(page.locator("ol[data-timeline] li[data-reveal]").last()).toHaveAttribute("data-revealed", "", { timeout: 3000 });
  });

  test("the language switch fades the page out before navigating", async ({ page }) => {
    await page.goto("/en/thread");
    await page.getByRole("link", { name: "Read this page in Hindi" }).click();
    await expect(page).toHaveURL(/\/hi\/thread$/);
    await expect(page.locator("main")).toHaveCSS("opacity", "1");
  });
});
