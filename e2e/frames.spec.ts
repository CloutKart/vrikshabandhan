import { test } from "@playwright/test";

/** Review artifacts: frames of the hero sequence and the knot while motion is on. */
test("hero sequence frames", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en", { waitUntil: "commit" });
  for (const at of [150, 500, 800, 1300]) {
    await page.waitForTimeout(at === 150 ? 150 : at - [150, 500, 800, 1300][[150, 500, 800, 1300].indexOf(at) - 1]);
    await page.screenshot({ path: `e2e/__screenshots__/frame-hero-${at}ms.png` });
  }
});

test("the header thread at half scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/stories");
  await page.evaluate(() => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) / 2, behavior: "instant" }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "e2e/__screenshots__/frame-header-progress.png", clip: { x: 0, y: 0, width: 1440, height: 120 } });
});
