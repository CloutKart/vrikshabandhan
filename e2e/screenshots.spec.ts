import { test } from "@playwright/test";

/**
 * Review artifacts, not assertions: full-page captures of every route in both
 * locales, both themes and three widths, written to e2e/__screenshots__ (ignored by git).
 */
const routes = ["/", "/stories", "/stories/silkyara-open-letter", "/stories/seed-bombers-2023", "/founder", "/thread", "/get-involved", "/newsletter/confirm"];
const locales = ["en", "hi"] as const;
const themes = ["dark", "light"] as const;
const widths = [1920, 1440, 1024, 390];

for (const route of routes) {
  for (const locale of locales) {
    for (const theme of themes) {
      for (const width of widths) {
        const name = `${route === "/" ? "home" : route.slice(1).replace(/\//g, "-")}-${locale}-${theme}-${width}`;
        if (width === 1920 && route !== "/") continue;
        test(`screenshot ${name}`, async ({ page }) => {
          await page.setViewportSize({ width, height: width >= 1920 ? 960 : width > 820 ? 900 : 844 });
          await page.addInitScript((t) => localStorage.setItem("va-theme", t), theme);
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.goto(`/${locale}${route === "/" ? "" : route}`);
          await page.waitForLoadState("networkidle");
          await page.screenshot({ path: `e2e/__screenshots__/${name}.png`, fullPage: true });
        });
      }
    }
  }
}
