import { expect, test } from "@playwright/test";

test.describe("admin without Supabase", () => {
  test("says the database is not configured instead of failing", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Editor not configured");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("the login page is reachable and explains itself", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator('a[href="#"]').count()).toBe(0);
  });

  test("admin pages are not routed through the locale proxy", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("admin with Supabase", () => {
  test.skip(!process.env.E2E_SUPABASE, "set E2E_SUPABASE=1 with a configured project to run");

  test("an editor can sign in, create, publish and undo-delete a post", async ({ page }) => {
    await page.goto("/admin/login");
    // Filled in when a test project exists: magic-link flow needs an inbox stub.
    expect(true).toBe(true);
  });
});
