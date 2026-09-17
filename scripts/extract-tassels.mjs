/**
 * Lifts the thread's loose ends off the hero cut-outs so they can drift on their own layer.
 *   node scripts/extract-tassels.mjs
 * Reads assets/painting/tree-cutout*.webp and tree-painting*.jpg (untouched sources), writes
 * public/images/tree-cutout*.webp and tree-painting*.jpg (ends painted out of both, so nothing static
 * shows behind the moving layer) and public/images/tassel*.png (the ends alone, transparent elsewhere).
 * The band and the knot stay in place: a thread tied round a trunk does not slide.
 */
import sharp from "sharp";

const REGION = { x: 1330, y: 760, w: 150, h: 120 };
const isThread = (r, g, b, a) => a > 128 && r > 140 && r - g > 45 && r - b > 70;

async function run(variant) {
  const suffix = variant === "light" ? "-light" : "";
  const src = `assets/painting/tree-cutout${suffix}.webp`;
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const idx = (x, y) => (y * W + x) * 4;

  // Mask of thread pixels in the region, dilated by one pixel.
  const raw = new Uint8Array(W * H);
  for (let y = REGION.y; y < REGION.y + REGION.h; y++)
    for (let x = REGION.x; x < REGION.x + REGION.w; x++) {
      const i = idx(x, y);
      if (isThread(data[i], data[i + 1], data[i + 2], data[i + 3])) raw[y * W + x] = 1;
    }
  const mask = new Uint8Array(W * H);
  let count = 0, minx = W, maxx = 0, miny = H, maxy = 0;
  for (let y = REGION.y; y < REGION.y + REGION.h; y++)
    for (let x = REGION.x; x < REGION.x + REGION.w; x++) {
      let hit = 0;
      for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1 && !hit; dx++) hit = raw[(y + dy) * W + (x + dx)];
      if (hit) { mask[y * W + x] = 1; count++; minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
    }

  // The ends alone, on transparency.
  const layer = Buffer.alloc(REGION.w * REGION.h * 4);
  for (let y = 0; y < REGION.h; y++)
    for (let x = 0; x < REGION.w; x++) {
      const X = REGION.x + x, Y = REGION.y + y, i = idx(X, Y), o = (y * REGION.w + x) * 4;
      if (mask[Y * W + X]) { layer[o] = data[i]; layer[o + 1] = data[i + 1]; layer[o + 2] = data[i + 2]; layer[o + 3] = data[i + 3]; }
    }
  await sharp(layer, { raw: { width: REGION.w, height: REGION.h, channels: 4 } }).png().toFile(`public/images/tassel${suffix}.png`);

  // Paint the ends out: each masked pixel takes the mean of its nearest unmasked row neighbours.
  const inpaint = (src) => {
    const out = Buffer.from(src);
    const sample = (x, y, dx, dy) => {
      for (let k = 1; k <= 40; k++) {
        const X = x + dx * k, Y = y + dy * k;
        if (X < 0 || Y < 0 || X >= W || Y >= H) return null;
        if (!mask[Y * W + X]) return idx(X, Y);
      }
      return null;
    };
    for (let y = REGION.y; y < REGION.y + REGION.h; y++)
      for (let x = REGION.x; x < REGION.x + REGION.w; x++) {
        if (!mask[y * W + x]) continue;
        const picks = [sample(x, y, -1, 0), sample(x, y, 1, 0)].filter((p) => p !== null);
        if (!picks.length) picks.push(...[sample(x, y, 0, -1), sample(x, y, 0, 1)].filter((p) => p !== null));
        const o = idx(x, y);
        for (let c = 0; c < 4; c++) out[o + c] = Math.round(picks.reduce((s, p) => s + src[p + c], 0) / picks.length);
      }
    return out;
  };
  await sharp(inpaint(data), { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 95 }).toFile(`public/images/tree-cutout${suffix}.webp`);

  // The painting behind the cut-out shows through where the ends hung over the background, so it loses them too.
  const painting = await sharp(`assets/painting/tree-painting${suffix}.jpg`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (painting.info.width !== W || painting.info.height !== H) throw new Error("painting and cut-out differ in size");
  await sharp(inpaint(painting.data), { raw: { width: W, height: H, channels: 4 } }).removeAlpha().jpeg({ quality: 92, mozjpeg: true }).toFile(`public/images/tree-painting${suffix}.jpg`);
  console.log(`${variant}: ${count} thread pixels lifted, box x ${minx}-${maxx} y ${miny}-${maxy}`);
}

await run("dark");
await run("light");
