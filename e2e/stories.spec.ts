import { expect, test } from "@playwright/test";

test.describe("stories index", () => {
  test("lists the built-in stories as links, newest first", async ({ page }) => {
    await page.goto("/en/stories");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Stories from the field");
    const links = page.locator("[data-story-list] a[href^='/en/stories/']");
    await expect(links).toHaveCount(3);
    await expect(links.first()).toHaveAttribute("href", "/en/stories/silkyara-open-letter");
    await expect(links.last()).toHaveAttribute("href", "/en/stories/rampur-tiraha");
  });

  test("a tag in the URL narrows the list and marks its chip current", async ({ page }) => {
    await page.goto("/en/stories?tag=Open%20letter");
    await expect(page.locator("[data-story-list] a[href^='/en/stories/']")).toHaveCount(1);
    const chip = page.getByRole("link", { name: "Open letter" });
    await expect(chip).toHaveAttribute("aria-current", "page");
    const box = await chip.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("dates and places are set on separate lines, without middle dots", async ({ page }) => {
    await page.goto("/en/stories");
    const text = await page.locator("main").innerText();
    expect(text).not.toContain("·");
    await expect(page.locator("[data-story-list] time").first()).toHaveText("11 December 2023");
  });

  test("the home page shows the three latest stories", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Latest stories" })).toBeVisible();
    await expect(page.locator("[data-story-list] a[href^='/en/stories/']")).toHaveCount(3);
  });
});

test.describe("story page", () => {
  test("renders the letter with a clean heading order and a cited quote", async ({ page }) => {
    await page.goto("/en/stories/silkyara-open-letter");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1 [lang='hi']")).toContainText("सिल्क्यारा");
    await expect(page.locator("h3, h4, h5, h6")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "Ten years of warnings" })).toBeVisible();
    const quote = page.locator("blockquote").first();
    await expect(quote.locator("cite")).toContainText("Jagadguru Swami Avimukteshwaranand");
    await expect(page.locator("[data-paper] time")).toHaveText("11 December 2023");
  });

  test("the Hindi page says the body is English only and marks the column lang", async ({ page }) => {
    await page.goto("/hi/stories/silkyara-open-letter");
    await expect(page.getByText("यह कहानी अभी केवल अंग्रेज़ी में उपलब्ध है।")).toBeVisible();
    await expect(page.locator("[data-body]")).toHaveAttribute("lang", "en");
  });

  test("an unknown slug is a 404", async ({ page }) => {
    const response = await page.goto("/en/stories/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
