import { expect, test } from "@playwright/test";

test("the root redirects to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the Hindi locale sets the document language", async ({ page }) => {
  await page.goto("/hi");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
});

test("the dark theme is the default and is declared before paint", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /^#/);
});

test.describe("layout shell", () => {
  test("the first Tab lands on the skip link, which targets the main content", async ({ page }) => {
    await page.goto("/en");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute("href", "#content");
    await expect(page.locator("main#content")).toHaveCount(1);
  });

  test("the mobile menu is a dialog that returns focus to its trigger", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/en");
    const trigger = page.getByRole("button", { name: "Menu" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Stories" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("the theme toggle switches to light, persists across reload and updates theme-color", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Switch to the light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#E4EAE1");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("button", { name: "Switch to the dark theme" })).toHaveAttribute("aria-pressed", "true");
  });

  test("the locale switch goes to the same page in the other language", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Read this page in Hindi" }).click();
    await expect(page).toHaveURL(/\/hi$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await page.getByRole("link", { name: "यह पृष्ठ अंग्रेज़ी में पढ़ें" }).click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test("the thread is present on desktop and hidden on phones", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator('[data-thread]')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('[data-thread]')).toBeHidden();
  });

  test("the thread is a braided rakhi with a medallion and leaves, not a plain bar", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("[data-thread] line")).toHaveAttribute("stroke", /^url\(/);
    await expect(page.locator("[data-knot-dot] .leaf")).toHaveCount(3);
    await expect(page.locator("[data-knot-dot] circle").first()).toBeVisible();
  });

  test("the native scrollbar is hidden where the rakhi is shown, and the page still scrolls", async ({ page }) => {
    await page.goto("/en/stories");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).toBe("none");
    expect(await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 400));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await page.setViewportSize({ width: 390, height: 800 });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).not.toBe("none");
  });

  test("no link uses a bare hash href", async ({ page }) => {
    await page.goto("/en");
    expect(await page.locator('a[href="#"]').count()).toBe(0);
  });
});
