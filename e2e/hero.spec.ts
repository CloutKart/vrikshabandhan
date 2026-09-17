import { expect, test } from "@playwright/test";

test("the hero has one bilingual h1 with a lang on each line", async ({ page }) => {
  await page.goto("/en");
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  await expect(h1.locator('[lang="en"]')).toHaveText("A thread tied to a tree");
  await expect(h1.locator('[lang="hi"]')).toHaveText("पेड़ से बँधा एक धागा");
});

test("the Hindi home page leads with the Hindi line", async ({ page }) => {
  await page.goto("/hi");
  const first = page.locator("h1 > span").first();
  await expect(first).toHaveAttribute("lang", "hi");
});

test("the tree is the priority image and describes itself; the canvas behind it is bare", async ({ page }) => {
  await page.goto("/en");
  const tree = page.locator('img.hero-tree[data-variant="dark"]');
  // next/image "priority": never lazy, and either a preload link or fetchpriority=high.
  expect(await tree.getAttribute("loading")).not.toBe("lazy");
  const preloads = await page.locator('link[rel="preload"][as="image"][imagesrcset*="tree-cutout"]').count();
  const fetchPriority = await tree.getAttribute("fetchpriority");
  expect(preloads > 0 || fetchPriority === "high").toBe(true);
  await expect(tree).toHaveAttribute("alt", /raksha sutra/);
  // The background is the bare canvas, so nothing is ever painted twice behind the moving tree.
  const canvas = page.locator('img.hero-painting[data-variant="dark"]');
  await expect(canvas).toHaveAttribute("alt", "");
  expect(await canvas.getAttribute("src")).toContain("canvas");
  // The light variants exist for the light theme but are never fetched while hidden.
  await expect(page.locator('img.hero-painting[data-variant="light"]')).toHaveAttribute("loading", "lazy");
  await expect(page.locator('img.hero-painting[data-variant="light"]')).toBeHidden();
  await expect(page.locator('img.hero-tree[data-variant="light"]')).toBeHidden();
});

test("the light theme shows the cream painting and its cut-out, and keeps the depth", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("va-theme", "light"));
  await page.goto("/en");
  await expect(page.locator('img.hero-painting[data-variant="light"]')).toBeVisible();
  await expect(page.locator('img.hero-painting[data-variant="dark"]')).toBeHidden();
  await expect(page.locator('img.hero-tree[data-variant="light"]')).toBeVisible();
  await expect(page.locator('img.hero-tree[data-variant="dark"]')).toBeHidden();
  // The headline sits under the leaves: its top is above the canopy's lower edge (about 72% of the art height).
  const art = await page.locator(".hero-art").boundingBox();
  const title = await page.locator("h1").boundingBox();
  expect(title!.y).toBeLessThan(art!.y + art!.height * 0.7);
  expect(title!.width).toBeGreaterThan(art!.width * 0.3);
});

test("the thread's loose ends are their own layer and drift only with full motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en");
  await expect(page.locator("img.hero-tassel")).toHaveCount(2);
  await expect(page.locator('img.hero-tassel[data-variant="dark"]')).toHaveAttribute("alt", "");
  await expect(page.locator('img.hero-tassel[data-variant="light"]')).toBeHidden();
  const tassel = page.locator('img.hero-tassel[data-variant="dark"]');
  await expect(tassel).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  await expect.poll(() => tassel.evaluate((el) => getComputedStyle(el).animationName)).toBe("tassel-sway");
  const art = await page.locator(".hero-art").boundingBox();
  const box = await tassel.boundingBox();
  expect(box!.x).toBeGreaterThan(art!.x + art!.width / 2);
  expect(box!.y).toBeGreaterThan(art!.y + art!.height / 2);
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(tassel).toBeVisible();
  expect(await tassel.evaluate((el) => getComputedStyle(el).animationName)).toBe("tassel-sway");
});

test("leaves fall across the headline with full motion, and do not exist under reduced motion", async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  const leaves = page.locator("[data-hero-leaves] .hero-leaf");
  await expect(leaves).toHaveCount(9);
  await expect(page.locator("[data-hero-leaves]")).toBeVisible();
  expect(await leaves.first().evaluate((el) => getComputedStyle(el).animationName)).toBe("leaf-fall");
  // In front of the headline, behind the cut-out (so they come out of the canopy and pass behind the trunk).
  const z = await page.locator("[data-hero-leaves]").evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));
  const cutoutZ = await page.locator('img.hero-tree[data-variant="dark"]').evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));
  expect(z).toBeGreaterThan(1);
  expect(z).toBeLessThan(cutoutZ);
  expect(new Set(await leaves.evaluateAll((els) => els.map((e) => e.getAttribute("data-shape")))).size).toBeGreaterThanOrEqual(5);
  await expect(page.locator("[data-hero-leaves] .hero-leaf-wind")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator("[data-hero-leaves]")).toBeVisible();
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const quiet = await context.newPage();
  await quiet.goto("/en");
  await expect(quiet.locator("[data-hero-leaves]")).toBeHidden();
  await context.close();
});

test("the branches move in the wind with full motion, and the tips move more than the trunk", async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem("va-hero", "1"));
  await page.goto("/en");
  await expect(page.locator(".hero-art canvas.hero-sway")).toHaveCount(1);
  await expect(page.locator(".hero-art")).toHaveAttribute("data-sway", "", { timeout: 5000 });
  await expect(page.locator('img.hero-tree[data-variant="dark"]')).toHaveCSS("opacity", "0");
  const art = (await page.locator(".hero-art").boundingBox())!;
  const cutoutZ = await page.locator('img.hero-tree[data-variant="dark"]').evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));
  const region = (x: number, y: number, w: number, h: number) => ({ x: art.x + art.width * x, y: art.y + art.height * y, width: art.width * w, height: art.height * h });
  const tips = region(0.03, 0.25, 0.22, 0.4);
  // The trunk base, below the knot and the moving thread ends.
  const trunk = region(0.77, 0.92, 0.08, 0.07);
  const sharp = (await import("sharp")).default;
  const shot = async (clip: { x: number; y: number; width: number; height: number }) => sharp(await page.screenshot({ clip })).raw().toBuffer();
  const meanDiff = (a: Buffer, b: Buffer) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    return sum / a.length;
  };
  // Three moments 700 ms apart: the gust may be near a turning point at one of them, so take the largest change.
  const frames: Array<{ tips: Buffer; trunk: Buffer }> = [];
  for (let i = 0; i < 3; i++) {
    frames.push({ tips: await shot(tips), trunk: await shot(trunk) });
    if (i < 2) await page.waitForTimeout(700);
  }
  const tipChange = Math.max(meanDiff(frames[0].tips, frames[1].tips), meanDiff(frames[1].tips, frames[2].tips), meanDiff(frames[0].tips, frames[2].tips));
  const trunkChange = Math.max(meanDiff(frames[0].trunk, frames[1].trunk), meanDiff(frames[1].trunk, frames[2].trunk));
  expect(tipChange, "tips move").toBeGreaterThan(2);
  expect(trunkChange, "trunk stays").toBeLessThan(1);
  // The thread: the band round the trunk is still; the knot and its ends are a springy layer above the tree.
  const band = page.locator('img.hero-thread-band[data-variant="dark"]');
  await expect(band).toBeVisible();
  expect(await band.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  expect(await page.locator('img.hero-tassel[data-variant="dark"]').evaluate((el) => getComputedStyle(el).animationName)).toBe("tassel-sway");
  expect(await band.evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10))).toBeGreaterThan(cutoutZ);
  // Phones get the same moving tree and thread.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.locator(".hero-art canvas.hero-sway")).toBeVisible();
  await expect(band).toBeVisible();
  expect(await band.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  expect(await page.locator('img.hero-tassel[data-variant="dark"]').evaluate((el) => getComputedStyle(el).animationName)).toBe("tassel-sway");
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const quiet = await context.newPage();
  await quiet.goto("/en");
  await expect(quiet.locator("html")).toHaveAttribute("data-motion-ready", "");
  await expect(quiet.locator(".hero-art canvas.hero-sway")).toHaveCount(0);
  await context.close();
});

test("with reduced motion the loose ends hold still", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("/en");
  expect(await page.locator('img.hero-tassel[data-variant="dark"]').evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await context.close();
});

test("the hero calls to action are real links", async ({ page }) => {
  await page.goto("/en");
  const hero = page.locator(".hero");
  await expect(hero.getByRole("link", { name: "Read the stories" })).toHaveAttribute("href", "/en/stories");
  await expect(hero.getByRole("link", { name: "Tie a thread with us" })).toHaveAttribute("href", "/en/get-involved");
});

test("no painting credit is shown while the credit is empty", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("[data-credit]")).toHaveCount(0);
});

test.describe("wide, short screens", () => {
  test.use({ viewport: { width: 2000, height: 960 } });

  test("the painting and the brand share one column, and the lede is in the first screen", async ({ page }) => {
    await page.goto("/en");
    const painting = await page.locator(".hero-art").boundingBox();
    const brand = await page.getByRole("link", { name: /Vrikshabandhan Abhiyan/ }).first().boundingBox();
    expect(painting && brand).toBeTruthy();
    expect(Math.abs(painting!.x - brand!.x), "painting aligns with the brand").toBeLessThanOrEqual(1);
    const pageMax = 2000; // the layout fills the window
    expect(painting!.x + painting!.width, "painting stays inside the column").toBeLessThanOrEqual((2000 - pageMax) / 2 + pageMax + 1);
    expect(await page.locator(".hero-art").evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("24px");
    expect(await page.locator(".hero-art").evaluate((el) => getComputedStyle(el).borderBottomRightRadius)).toBe("24px");
    await expect(page.getByText(/Since 2005 we have planted/)).toBeInViewport();
  });
});

test.describe("latest stories in the hero", () => {
  test("on wide screens the right column holds the three latest stories, once", async ({ page }) => {
    await page.setViewportSize({ width: 2000, height: 960 });
    await page.goto("/en");
    const aside = page.locator(".hero-aside");
    await expect(aside).toBeVisible();
    await expect(aside.locator("[data-story-list] a[href^='/en/stories/']")).toHaveCount(3);
    const art = await page.locator(".hero-art").boundingBox();
    const box = await aside.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(art!.x + art!.width);
    expect(Math.abs(box!.y + box!.height - (art!.y + art!.height))).toBeLessThanOrEqual(8);
    await expect(page.locator("[data-story-list]:visible")).toHaveCount(1);
  });

  test("on narrower screens the list sits below the hero, once", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");
    await expect(page.locator(".hero-aside")).toBeHidden();
    await expect(page.locator("[data-story-list]:visible")).toHaveCount(1);
    const art = await page.locator(".hero-art").boundingBox();
    const list = await page.locator("[data-story-list]:visible").boundingBox();
    expect(list!.y).toBeGreaterThan(art!.y + art!.height);
  });
});

test("a frame that reads wrong (a black texture, as Safari has produced) keeps the still tree in view", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    // Whatever WebGL draws, report opaque black everywhere, the way a failed texture upload looks.
    WebGLRenderingContext.prototype.readPixels = function (_x, _y, _w, _h, _f, _t, out: ArrayBufferView | null) {
      if (out instanceof Uint8Array) out.set([0, 0, 0, 255]);
    } as typeof WebGLRenderingContext.prototype.readPixels;
  });
  const page = await context.newPage();
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  await expect(page.locator('img.hero-tree[data-variant="dark"]')).toBeVisible();
  await expect.poll(() => page.locator("canvas.hero-sway").count(), { timeout: 5000 }).toBe(0);
  await expect(page.locator(".hero-art")).not.toHaveAttribute("data-sway", "");
  await expect(page.locator('img.hero-tree[data-variant="dark"]')).toHaveCSS("opacity", "1");
  await context.close();
});

test("on phones the hero is the square painting with its own tree and thread; on desktop the wide one", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const art = (await page.locator(".hero-art").boundingBox())!;
  expect(Math.abs(art.width - art.height)).toBeLessThanOrEqual(1);
  expect(art.x).toBeGreaterThanOrEqual(0);
  expect(art.x + art.width).toBeLessThanOrEqual(390);
  const tree = page.locator('img.hero-tree[data-variant="dark"]');
  await expect.poll(() => tree.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain("tree-cutout-sq");
  await expect.poll(() => page.locator('img.hero-painting[data-variant="dark"]').evaluate((el: HTMLImageElement) => el.currentSrc)).toContain("canvas-sq");
  const band = page.locator('img.hero-thread-band[data-variant="dark"]');
  await expect.poll(() => band.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain("thread-band-sq");
  const box = (await band.boundingBox())!;
  expect(box.x).toBeGreaterThan(art.x + art.width / 2);
  expect(box.y).toBeGreaterThan(art.y + art.height / 2);
  expect(box.x + box.width).toBeLessThan(art.x + art.width);
  expect(box.y + box.height).toBeLessThan(art.y + art.height);
  // The moving tree draws the square frame and its first frame passes the check.
  await expect(page.locator(".hero-art canvas.hero-sway")).toHaveCount(1);
  await expect(page.locator(".hero-art")).toHaveAttribute("data-sway", "", { timeout: 5000 });
  await expect(page.locator("[data-hero-leaves] .hero-leaf")).toHaveCount(9);
  // The headline sits inside the square, bottom left, behind the tree, as on desktop.
  const title = (await page.locator(".hero-title").boundingBox())!;
  expect(title.x).toBeGreaterThan(art.x);
  expect(title.x + title.width, "title clears the trunk").toBeLessThan(art.x + art.width * 0.74);
  expect(title.y, "title sits in the lower part").toBeGreaterThan(art.y + art.height * 0.6);
  expect(title.y + title.height).toBeLessThanOrEqual(art.y + art.height + 1);
  const titleZ = await page.locator(".hero-title").evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));
  const treeZ = await tree.evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));
  expect(titleZ).toBeLessThan(treeZ);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(() => tree.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain("tree-cutout.");
  await expect(page.locator(".hero-art")).toHaveAttribute("data-sway", "", { timeout: 5000 });
  await expect(page.locator("canvas.hero-sway")).toHaveAttribute("data-texture", "1672x941");
});

test("on a 3x phone the tree is drawn at full pixel density", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/en");
  await expect(page.locator(".hero-art")).toHaveAttribute("data-sway", "", { timeout: 5000 });
  const art = (await page.locator(".hero-art").boundingBox())!;
  const drawn = await page.locator("canvas.hero-sway").evaluate((el: HTMLCanvasElement) => el.width);
  // Headless test runners often have no GPU; the module then draws at 1x. With a GPU, a phone square draws at 3x.
  const software = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl");
    const dbg = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(dbg ? gl?.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER));
    return /swiftshader|llvmpipe|software/i.test(renderer);
  });
  expect(drawn).toBe(Math.round(art.width * (software ? 1 : 3)));
  // The candidate above the screen's 1170 device px: Next serves the painting at its full 1254 px for it.
  const src = await page.locator('img.hero-tree[data-variant="dark"]').evaluate((el: HTMLImageElement) => el.currentSrc);
  expect(src).toMatch(/w=1920/);
  expect(src).toMatch(/q=85/);
  // The texture is the painting's own size, not the density-divided naturalWidth (305 here).
  await expect(page.locator("canvas.hero-sway")).toHaveAttribute("data-texture", "1254x1254");
  await context.close();
});


test("the word thread in the headline wears the thread's red, in both languages and after the entrance", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("data-motion-ready", "");
  await expect(page.locator("html")).not.toHaveAttribute("data-hero", "pending", { timeout: 5000 });
  const accents = page.locator(".hero-title [data-accent]");
  await expect(accents).toHaveCount(2);
  await expect(accents.nth(0)).toHaveText("thread");
  await expect(accents.nth(1)).toHaveText("धागा");
  for (const el of await accents.all()) expect(await el.evaluate((e) => getComputedStyle(e).color)).toBe("rgb(175, 71, 44)");
  // The split entrance keeps the word's colour on every character.
  const charColours = await page.locator(".hero-title [data-accent] *").evaluateAll((els) => els.map((e) => getComputedStyle(e).color));
  for (const c of charColours) expect(c).toBe("rgb(175, 71, 44)");
  await page.goto("/hi");
  await expect(page.locator(".hero-title [data-accent]").nth(0)).toHaveText("धागा");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".hero-title [data-accent]").nth(0)).toBeVisible();
});


test("a pinch zoom redraws the tree at the zoomed density instead of stretching it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await expect(page.locator(".hero-art")).toHaveAttribute("data-sway", "", { timeout: 5000 });
  const canvas = page.locator("canvas.hero-sway");
  const before = await canvas.evaluate((el: HTMLCanvasElement) => el.width);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2.5 });
  await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.width), { timeout: 3000 }).toBeGreaterThanOrEqual(Math.round(before * 2.4));
  await expect(page.locator(".hero-art")).toHaveAttribute("data-sway", "");
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
  await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.width), { timeout: 3000 }).toBe(before);
});
