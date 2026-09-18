import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The story editor on the demo route (EDITOR_DEMO=1, set by the Playwright
 * server): fixture content, no database, and the saved text shown under the
 * sheet so a test can read exactly what the editor writes back.
 */
const DEMO = "/admin/editor-demo";

async function open(page: Page) {
  await page.goto(DEMO);
  const box = page.getByRole("textbox", { name: /Story text/ });
  await expect(box).toBeVisible();
  return box;
}

const savedEn = (page: Page) => page.locator("[data-saved-en]").innerText();
const savedHi = (page: Page) => page.locator("[data-saved-hi]").innerText();

test.describe("the story editor", () => {
  test("shows the story as a document, with a labelled toolbar and the saved text unchanged", async ({ page }) => {
    const box = await open(page);
    await expect(box).toHaveAttribute("lang", "en");
    await expect(box.locator("h2")).toHaveText("What is a seed bomb");
    await expect(box.locator("strong")).toHaveText("before the monsoon");
    await expect(box.locator("blockquote cite")).toHaveText("Manoj Dhyani");
    await expect(box.locator("ul li")).toHaveCount(2);
    await expect(box.locator("[data-story-figure] img")).toBeVisible();
    const toolbar = page.getByRole("toolbar", { name: "Formatting" });
    for (const name of ["Bold", "Italic", "Subheading", "Quote", "Source", "Bullets", "Numbers", "Link", "Photo", "Film", "Undo", "Redo"]) {
      await expect(toolbar.getByRole("button", { name, exact: true })).toBeVisible();
    }
    expect(await savedEn(page)).toBe("Seed bombs are made **before the monsoon**.\n## What is a seed bomb\n> Be careful in time. — Manoj Dhyani\n- Mud\n- Seeds\n![Volunteers](media:images/seed-bombers-2023.jpg)");
  });

  test("typing with Ctrl+B writes bold into the story format, and Undo takes it back", async ({ page }) => {
    const box = await open(page);
    await box.locator("p").first().click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Added ");
    await page.keyboard.press("Control+b");
    await expect(page.getByRole("button", { name: "Bold", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.type("bold");
    await page.keyboard.press("Control+b");
    await expect.poll(() => savedEn(page)).toContain("Seed bombs are made **before the monsoon**. Added **bold**");
    await expect(page.locator("[data-word-count]")).toContainText("words");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect.poll(() => savedEn(page)).not.toContain("Added **bold**");
  });

  test("words selected with the mouse take Bold and Italic from the toolbar buttons", async ({ page }) => {
    const box = await open(page);
    const h2 = box.locator("h2");
    const b = (await h2.boundingBox())!;
    await page.mouse.move(b.x + 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width - 2, b.y + b.height / 2, { steps: 6 });
    await page.mouse.up();
    await page.getByRole("button", { name: "Bold", exact: true }).click();
    await expect(h2.locator("strong")).toHaveText("What is a seed bomb");
    await page.getByRole("button", { name: "Italic", exact: true }).click();
    await expect(h2.locator("em")).toHaveCount(1);
    await expect.poll(() => savedEn(page)).toMatch(/## (\*\*_|_\*\*)What is a seed bomb(_\*\*|\*\*_)/);
  });

  test("a Word-style paste keeps headings, bold, italic, links and lists and drops the rest", async ({ page }) => {
    const box = await open(page);
    await box.locator("p").first().click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.evaluate(() => {
      const html = `<h1 style="font-size:30pt;color:red;font-family:Calibri">Pasted title</h1><p style="margin:12pt"><b>Bold</b> and <span style="font-style:italic">slanted</span> and <a href="https://example.org/x">a link</a></p><ul><li>one</li><li>two</li></ul><table><tr><td>cell</td></tr></table>`;
      const dt = new DataTransfer();
      dt.setData("text/html", html);
      dt.setData("text/plain", "Pasted title");
      document.querySelector("[role='textbox']")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await expect.poll(() => savedEn(page)).toContain("## Pasted title\n**Bold** and _slanted_ and [a link](https://example.org/x)\n- one\n- two\ncell");
    expect(await savedEn(page)).not.toMatch(/style=|Calibri|<table/);
  });

  test("a plain-text paste written in the story format becomes real headings, lists, marks and links", async ({ page }) => {
    const box = await open(page);
    await box.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    const text = "Intro with **bold** words.\n## Choose the tree\n- One\n- Two\n> Be careful. — Manoj Dhyani\nSee [the thread](https://vrikshabandhanabhiyan.in/en/thread) now.\n@youtube(https://youtu.be/XTmHXvDXcI0)";
    await page.evaluate((t) => {
      const dt = new DataTransfer();
      dt.setData("text/plain", t);
      document.querySelector("[role='textbox']")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    }, text);
    await expect(box.locator("h2")).toHaveText("Choose the tree");
    await expect(box.locator("strong")).toHaveText("bold");
    await expect(box.locator("ul li")).toHaveCount(2);
    await expect(box.locator("blockquote cite")).toHaveText("Manoj Dhyani");
    await expect(box.locator("a[href='https://vrikshabandhanabhiyan.in/en/thread']")).toHaveText("the thread");
    await expect(box.locator("[data-story-film]")).toHaveCount(1);
    await expect.poll(() => savedEn(page)).toBe(text);
  });

  test("a plain-text paste of one ordinary line goes in as words, not as a new paragraph", async ({ page }) => {
    const box = await open(page);
    await box.locator("p").first().click();
    await page.keyboard.press("End");
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData("text/plain", " and more");
      document.querySelector("[role='textbox']")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await expect.poll(() => savedEn(page)).toContain("Seed bombs are made **before the monsoon**. and more\n## What is a seed bomb");
  });

  test("pasted files are refused with a pointer to the uploads", async ({ page }) => {
    const box = await open(page);
    await box.locator("p").first().click();
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(["x"], "photo.jpg", { type: "image/jpeg" }));
      document.querySelector("[role='textbox']")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await expect(page.getByRole("status").filter({ hasText: "Photos go through the uploads" })).toBeVisible();
  });

  test("the language switch keeps both texts and marks the sheet's language", async ({ page }) => {
    const box = await open(page);
    await page.getByRole("tab", { name: "हिंदी" }).click();
    await expect(box).toHaveAttribute("lang", "hi");
    await expect(box.locator("p").first()).toHaveText("बीज बम मानसून से पहले बनते हैं।");
    await box.locator("p").first().click();
    await page.keyboard.press("End");
    await page.keyboard.type(" और धागा।");
    await expect.poll(() => savedHi(page)).toBe("बीज बम मानसून से पहले बनते हैं। और धागा।");
    await page.getByRole("tab", { name: "English" }).click();
    await expect(box).toHaveAttribute("lang", "en");
    await expect(box.locator("h2")).toHaveText("What is a seed bomb");
    expect(await savedEn(page)).toContain("## What is a seed bomb");
  });

  test("the empty-line hint follows the language switch both ways", async ({ page }) => {
    const box = await open(page);
    const hint = async () => {
      await page.keyboard.press("Control+End");
      await page.keyboard.press("Enter");
      return box.locator("p").last().getAttribute("data-placeholder");
    };
    await page.getByRole("tab", { name: "हिंदी" }).click();
    await box.locator("p").first().click();
    expect(await hint()).toBe("कहानी लिखें। हर अनुच्छेद में एक बात।");
    await page.getByRole("tab", { name: "English" }).click();
    await box.locator("p").first().click();
    expect(await hint()).toBe("Write the story. One idea per paragraph.");
    await page.getByRole("tab", { name: "हिंदी" }).click();
    await box.locator("p").first().click();
    expect(await hint()).toBe("कहानी लिखें। हर अनुच्छेद में एक बात।");
  });

  test("a film needs a YouTube link and lands in the text as a film line", async ({ page }) => {
    const box = await open(page);
    await box.locator("p").first().click();
    await page.keyboard.press("End");
    await page.getByRole("button", { name: "Film", exact: true }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.locator("#film-url").fill("https://example.org/not-a-film");
    await dialog.getByRole("button", { name: "Place the film" }).click();
    await expect(dialog.getByRole("alert")).toContainText("youtube.com or youtu.be");
    await dialog.locator("#film-url").fill("https://youtu.be/XTmHXvDXcI0");
    await dialog.getByRole("button", { name: "Place the film" }).click();
    await expect(dialog).toBeHidden();
    await expect(box.locator("[data-story-film]")).toHaveCount(1);
    await expect.poll(() => savedEn(page)).toContain("@youtube(https://youtu.be/XTmHXvDXcI0)");
  });

  test("a photo comes from the story's uploads and gets a caption", async ({ page }) => {
    const box = await open(page);
    await box.locator("h2").click();
    await page.keyboard.press("End");
    await page.getByRole("button", { name: "Photo", exact: true }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByRole("button", { name: /Volunteers with the campaign banner/ }).click();
    await expect(box.locator("[data-story-figure]")).toHaveCount(2);
    await box.locator("[data-story-figure]").first().getByLabel("Caption").fill("The team");
    await expect.poll(() => savedEn(page)).toContain("## What is a seed bomb\n![The team](media:images/seed-bombers-2023.jpg)");
  });

  test("a link is applied to the selection and Source adds a line under a quote", async ({ page }) => {
    const box = await open(page);
    await box.locator("h2").click();
    await page.keyboard.press("Home");
    await page.keyboard.press("Shift+End");
    await expect.poll(() => page.evaluate(() => getSelection()?.toString())).toBe("What is a seed bomb");
    await page.keyboard.press("Control+k");
    const dialog = page.locator("dialog[open]");
    await dialog.locator("#link-href").fill("https://example.org/seed");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect.poll(() => savedEn(page)).toContain("## [What is a seed bomb](https://example.org/seed)");
    await box.locator("ul li").last().click();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Plain line");
    await page.getByRole("button", { name: "Source", exact: true }).click();
    // The new source line exists (the fixture quote already has one) and holds the cursor before we type into it.
    await expect(box.locator("blockquote cite")).toHaveCount(2);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const n = getSelection()?.anchorNode;
          const el = n && n.nodeType === Node.ELEMENT_NODE ? (n as Element) : n?.parentElement;
          return Boolean(el?.closest("cite"));
        }),
      )
      .toBe(true);
    await page.keyboard.type("Who");
    await expect.poll(() => savedEn(page)).toContain("> Plain line — Who");
  });

  test("arrow keys move along the toolbar, and the sheet is accessible in both themes", async ({ page, browser }) => {
    await open(page);
    await page.getByRole("button", { name: "Bold", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "Italic", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("button", { name: "Bold", exact: true })).toBeFocused();
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext();
      await context.addInitScript((t) => localStorage.setItem("va-theme", t), theme);
      const p = await context.newPage();
      await open(p);
      const results = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations, theme).toEqual([]);
      await context.close();
    }
  });

  test("on a phone the toolbar wraps and every button stays a full target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const buttons = page.getByRole("toolbar", { name: "Formatting" }).getByRole("button");
    for (const b of await buttons.all()) {
      const box = await b.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
  });
});
