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
  await expect(page.locator("dl[data-lineage] dt")).toHaveCount(4);
  await expect(page.locator("[data-numbers]")).toHaveCount(0);
  const text = await page.locator("main").innerText();
  expect(text).not.toContain("·");
});

test("get involved: three ways, a contact section and real contact links", async ({ page }) => {
  await page.goto("/en/get-involved");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(4);
  await expect(page.locator("section#contact")).toHaveCount(1);
  await expect(page.locator("main a[href^='mailto:']")).toHaveCount(1);
  await expect(page.locator("main a[href^='tel:']")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Register a tree" })).toHaveAttribute("href", "/en/get-involved#contact");
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
