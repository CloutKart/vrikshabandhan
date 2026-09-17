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

  test("the theme toggle shows the theme it would switch to: a moon while light is on", async ({ page }) => {
    await page.goto("/en");
    const toggle = page.locator("header nav button[aria-pressed]");
    await expect(toggle.locator("[data-glyph='sun']")).toHaveCSS("opacity", "1");
    await expect(toggle.locator("[data-glyph='moon']")).toHaveCSS("opacity", "0");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle.locator("[data-glyph='moon']")).toHaveCSS("opacity", "1");
    await expect(toggle.locator("[data-glyph='sun']")).toHaveCSS("opacity", "0");
  });

  test("the theme switch is a daybreak from the sun, and instant under reduced motion", async ({ page, browser }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "full");
    const toggle = page.locator("header nav button[aria-pressed]");
    const box = (await toggle.boundingBox())!;
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme-switching", "to-light");
    const centre = await page.evaluate(() => {
      const s = document.documentElement.style;
      return [parseFloat(s.getPropertyValue("--vt-x")), parseFloat(s.getPropertyValue("--vt-y"))];
    });
    expect(centre[0]).toBeGreaterThan(box.x);
    expect(centre[0]).toBeLessThan(box.x + box.width);
    expect(centre[1]).toBeGreaterThan(box.y);
    expect(centre[1]).toBeLessThan(box.y + box.height);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching", /.+/, { timeout: 3000 });
    await expect(page.locator(".dawn-rim")).toHaveCount(0);
    // Back to dark: dusk.
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme-switching", "to-dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching", /.+/, { timeout: 3000 });
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const quiet = await context.newPage();
    await quiet.goto("/en");
    const [switching] = await Promise.all([
      quiet.evaluate(
        () =>
          new Promise<string | null>((resolve) => {
            const html = document.documentElement;
            const seen = new MutationObserver(() => resolve(html.dataset.themeSwitching ?? null));
            seen.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
          }),
      ),
      quiet.locator("header nav button[aria-pressed]").click(),
    ]);
    expect(switching).toBeNull();
    await expect(quiet.locator("html")).toHaveAttribute("data-theme", "light");
    await context.close();
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

  test("there is no left thread; the page margin is symmetric and the scrollbar is thin", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");
    await expect(page.locator("[data-thread]")).toHaveCount(0);
    const pad = await page.locator("main .page").first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return [parseFloat(cs.paddingLeft), parseFloat(cs.paddingRight)];
    });
    expect(Math.abs(pad[0] - pad[1])).toBeLessThan(1);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).toBe("thin");
  });

  test("the header thread grows with the scroll, like a thread being tied", async ({ page }) => {
    await page.goto("/en/thread");
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
    const scale = () =>
      page.evaluate(() => {
        const t = getComputedStyle(document.querySelector("[data-site-header]")!, "::after").transform;
        const m = t.match(/matrix\(([^,]+),/);
        return m ? parseFloat(m[1]) : t === "none" ? 1 : NaN;
      });
    expect(await scale()).toBeLessThan(0.05);
    await page.evaluate(() => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) / 2, behavior: "instant" }));
    await expect.poll(scale, { timeout: 2000 }).toBeGreaterThan(0.3);
    await expect.poll(scale, { timeout: 2000 }).toBeLessThan(0.75);
  });

  test("the header links to the editor without a language prefix", async ({ page }) => {
    for (const locale of ["en", "hi"]) {
      await page.goto(`/${locale}`);
      const admin = page.locator("header nav a[href='/admin']:visible");
      await expect(admin).toBeVisible();
      await expect(admin).toHaveText(locale === "en" ? "Admin" : "एडमिन");
    }
  });

  test("no link uses a bare hash href", async ({ page }) => {
    await page.goto("/en");
    expect(await page.locator('a[href="#"]').count()).toBe(0);
  });
});

test("the footer lists both e-mails and the three social links", async ({ page }) => {
  await page.goto("/en");
  const mails = await page.locator("footer a[href^='mailto:']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(mails).toEqual(["mailto:VrikshabandhanAbhiyan@gmail.com", "mailto:36chardhamassociates@gmail.com"]);
  const hosts = await page.locator("footer a[target='_blank']").evaluateAll((els) => els.map((e) => new URL(e.getAttribute("href")!).hostname));
  expect(hosts).toEqual(["www.facebook.com", "www.youtube.com", "www.instagram.com"]);
});

test("on phones the story filters are one row that scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/stories");
  const nav = page.getByRole("navigation", { name: /filter/i });
  const rows = new Set(await nav.locator("a").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top))));
  expect(rows.size).toBe(1);
  expect(await nav.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
});
