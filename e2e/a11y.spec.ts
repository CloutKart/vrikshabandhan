import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["", "/stories", "/stories?tag=Open%20letter", "/stories/silkyara-open-letter", "/founder", "/thread", "/get-involved"];
const routes = ["en", "hi"].flatMap((l) => pages.map((p) => `/${l}${p}`));
const themes = ["dark", "light"] as const;

for (const route of routes) {
  for (const theme of themes) {
    test(`${route} has no axe violations in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("va-theme", t), theme);
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
}
