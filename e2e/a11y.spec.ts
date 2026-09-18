import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["", "/stories", "/stories?tag=Open%20letter", "/stories/silkyara-open-letter", "/founder", "/thread", "/get-involved", "/newsletter/confirm?t=bad", "/newsletter/unsubscribe"];
const routes = ["en", "hi"].flatMap((l) => pages.map((p) => `/${l}${p}`));

// The audit measures the settled page: with motion on, axe would sample colours mid-fade.
test.use({ contextOptions: { reducedMotion: "reduce" } });
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

test.describe("keyboard", () => {
  test("header controls are reachable in order and focus is visible", async ({ page }) => {
    await page.goto("/en");
    const stops: Array<{ name: string; outline: string; width: number; tag: string }> = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return {
          name: (el.getAttribute("aria-label") || el.innerText || el.tagName).replace(/\s+/g, " ").trim(),
          outline: cs.outlineStyle,
          width: parseFloat(cs.outlineWidth),
          tag: el.tagName.toLowerCase(),
        };
      });
      if (info) stops.push(info);
    }
    const report = JSON.stringify(stops, null, 1);
    expect(stops.map((s) => s.name).slice(0, 3), report).toEqual(["Skip to content", "Vrikshabandhan Abhiyan Dehradun, Uttarakhand", "Stories"]);
    expect(stops.some((s) => s.name.startsWith("Switch to the")), report).toBe(true);
    for (const s of stops) {
      expect(s.outline, `${s.name}: ${report}`).not.toBe("none");
      expect(s.width, `${s.name}: ${report}`).toBeGreaterThanOrEqual(2);
    }
  });

  test("every page has exactly one h1 and a main landmark", async ({ page }) => {
    for (const route of routes) {
      await page.goto(route);
      expect(await page.locator("h1").count(), route).toBe(1);
      expect(await page.locator("main#content").count(), route).toBe(1);
    }
  });
});
