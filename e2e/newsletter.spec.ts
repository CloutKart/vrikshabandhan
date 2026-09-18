import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// These tests need a visitor who has not seen the invitation, so the default storage state is dropped.
test.use({ storageState: { cookies: [], origins: [] } });

const story = "/en/stories/silkyara-open-letter";

/** The invitation is wired up on hydration; scroll to the end of the story only once the page is live. */
async function readToTheEnd(page: import("@playwright/test").Page) {
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  await page.locator("[data-newsletter-end]").scrollIntoViewIfNeeded();
}

test.describe("the subscribe form", () => {
  for (const locale of ["en", "hi"]) {
    test(`is in the footer of /${locale} with a label, big targets and the Hindi option marked`, async ({ page }) => {
      await page.goto(`/${locale}`);
      const form = page.locator("footer [data-newsletter='footer'] form");
      await expect(form).toHaveCount(1);
      const input = form.getByRole("textbox");
      await expect(input).toHaveAccessibleName(/e-mail|ई-मेल/i);
      expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect((await form.getByRole("button").boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await expect(form.locator("input[type=radio][value=hi] + span")).toHaveAttribute("lang", "hi");
      await expect(form.locator("input[name=website]")).toHaveCount(1);
      await expect(page.locator('a[href="#"]')).toHaveCount(0);
    });
  }
  test("says subscriptions are not open when the site runs without a mail service", async ({ page }) => {
    await page.goto("/en");
    const form = page.locator("footer [data-newsletter='footer'] form");
    await form.getByRole("textbox").fill("name@example.com");
    await form.getByRole("button").click();
    await expect(page.locator("footer [data-newsletter='footer'] [role=status]")).toContainText("not open yet");
  });
  test("also sits on the stories page as a paper panel", async ({ page }) => {
    await page.goto("/hi/stories");
    await expect(page.locator("[data-newsletter='panel'] form")).toHaveCount(1);
  });
});

test.describe("the invitation on a story page", () => {
  test("opens once the reader reaches the end, takes focus, closes on Escape and never returns", async ({ page }) => {
    await page.goto(story);
    const dialog = page.getByRole("dialog", { name: "Get the next story by e-mail" });
    await expect(dialog).toBeHidden();
    await readToTheEnd(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox")).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem("va-newsletter"))).toBe("seen");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page.reload();
    await readToTheEnd(page);
    await page.waitForTimeout(500);
    await expect(dialog).toBeHidden();
  });
  test("opens after twelve seconds once the story is well scrolled, not before", async ({ page }) => {
    await page.clock.install();
    await page.goto(story);
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
    const dialog = page.locator("[data-newsletter-ask]");
    await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * 0.5));
    await page.clock.fastForward(11_000);
    await expect(dialog).not.toHaveAttribute("open", "");
    await page.clock.fastForward(2_000);
    await expect(dialog).toHaveAttribute("open", "");
  });
  test("stays closed for a reader who never scrolls, however long they wait", async ({ page }) => {
    await page.clock.install();
    await page.goto(story);
    await page.clock.fastForward(40_000);
    await expect(page.locator("[data-newsletter-ask]")).not.toHaveAttribute("open", "");
  });
  test("never interrupts the open phone menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(story);
    await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
    await page.getByRole("button", { name: /menu|मेन्यू/i }).click();
    await page.locator("[data-newsletter-end]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(page.locator("[data-newsletter-ask]")).not.toHaveAttribute("open", "");
  });
  test("has no accessibility violations open, in both themes, and no motion under reduced motion", async ({ browser }) => {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      await context.addInitScript((t) => localStorage.setItem("va-theme", t), theme);
      const page = await context.newPage();
      await page.goto(story);
      await readToTheEnd(page);
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations, theme).toEqual([]);
      await context.close();
    }
    const quiet = await browser.newContext({ reducedMotion: "reduce", storageState: { cookies: [], origins: [] } });
    const q = await quiet.newPage();
    await q.goto(story);
    await readToTheEnd(q);
    await expect(q.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    expect(await q.locator("[data-newsletter-ask]").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    await quiet.close();
  });
});

test.describe("the confirmation and unsubscribe pages", () => {
  test("answer a bad or missing link kindly, in both languages, without a mail service", async ({ page }) => {
    for (const [path, text] of [
      ["/en/newsletter/confirm?t=bad", "expired"],
      ["/hi/newsletter/confirm", "कड़ी"],
      ["/en/newsletter/unsubscribe?t=" + "f".repeat(64), "not open yet"],
      ["/hi/newsletter/unsubscribe", "मान्य नहीं"],
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator("main#content")).toHaveCount(1);
      await expect(page.locator("[data-token-card] [role=status], [data-token-card] form")).not.toHaveCount(0);
      if (!path.endsWith("f".repeat(64))) await expect(page.locator("[data-token-card]")).toContainText(text);
      await expect(page.locator('a[href="#"]')).toHaveCount(0);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, path).toEqual([]);
    }
  });
  test("a good unsubscribe link shows the button, and pressing it without a mail service says so", async ({ page }) => {
    await page.goto("/en/newsletter/unsubscribe?t=" + "f".repeat(64));
    await page.getByRole("button", { name: "Stop the e-mails" }).click();
    await expect(page.locator("[data-token-card] [role=status]")).toContainText("not open yet");
  });
  test("the one-click endpoint answers every POST with 200 and sends people to the page", async ({ request }) => {
    const post = await request.post("/api/newsletter/unsubscribe?t=bad", { data: "List-Unsubscribe=One-Click", headers: { "content-type": "application/x-www-form-urlencoded" } });
    expect(post.status()).toBe(200);
    expect(await post.text()).toBe("");
    const get = await request.get("/api/newsletter/unsubscribe?t=abc&l=hi", { maxRedirects: 0 });
    expect(get.status()).toBe(302);
    expect(get.headers().location).toContain("/hi/newsletter/unsubscribe?t=abc");
  });
});

test("noindex on the token pages, and the existing footer promises still hold", async ({ page }) => {
  await page.goto("/en/newsletter/confirm");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  await page.goto("/en");
  await expect(page.locator("footer a[target='_blank']")).toHaveCount(3);
  await expect(page.locator("footer a[href^='mailto:']")).toHaveCount(2);
});
