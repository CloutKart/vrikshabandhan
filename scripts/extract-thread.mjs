/**
 * Lifts the raksha sutra off the hero cut-outs so it can move on its own layers.
 *   node scripts/extract-thread.mjs
 * Reads assets/painting/tree-cutout*.webp (untouched sources) and writes, per frame and theme:
 *   public/images/thread-band*.png   the band and the knot round the trunk
 *   public/images/tassel*.png        the two loose ends below the knot
 *   public/images/tree-cutout*.webp  the tree with the thread painted out
 * The trunk under the band is filled from the rows above and below it (its sides are transparent);
 * the ground under the ends is filled from the pixels to their left and right.
 * Two frames: the wide painting (1672x941, desktop) and the square one (1254x1254, phones).
 */
import sharp from "sharp";

const FRAMES = {
  wide: { name: "tree-cutout", BAND: { x: 1290, y: 722, w: 190, h: 56 }, ENDS: { x: 1330, y: 778, w: 150, h: 102 }, smooth: false, bandFillMode: "mean", bandDirs: [[0, -1], [0, 1]], endsDirs: [[0, 1], [0, -1]] },
  // The square trunk carries heavier knife strokes, so its fill starts from box-averaged rows (single pixels would
  // stripe), and its edge slants under the loose ends, so those are filled from the nearest side in any direction.
  square: { name: "tree-cutout-sq", BAND: { x: 985, y: 882, w: 140, h: 60 }, ENDS: { x: 1055, y: 942, w: 120, h: 104 }, smooth: true, bandFillMode: "nearest", bandDirs: [[1, 0], [-1, 0], [0, 1], [0, -1]], endsDirs: [[1, 0], [-1, 0], [0, 1], [0, -1]] },
};
// Red and orange, including the darker shadowed strands along the edges of the band.
const isThread = (r, g, b, a) => a > 128 && r > 90 && r - g > 30 && r - b > 40;

async function run(frame, variant) {
  const { BAND, ENDS, smooth, bandFillMode, bandDirs, endsDirs } = FRAMES[frame];
  const suffix = variant === "light" ? "-light" : "";
  const base = FRAMES[frame].name;
  const { data, info } = await sharp(`assets/painting/${base}${suffix}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const idx = (x, y) => (y * W + x) * 4;

  const opaque = (x, y) => data[idx(x, y) + 3] > 128;
  // Thread pixels in the region, grown by two pixels. For the band, every trunk column (opaque just above and
  // below the band) is taken whole, so the fill is a clean vertical blend of bark and no red edge survives.
  const maskFor = (R, wholeTrunk) => {
    const raw = new Uint8Array(W * H);
    for (let y = R.y; y < R.y + R.h; y++)
      for (let x = R.x; x < R.x + R.w; x++) {
        const i = idx(x, y);
        const trunkColumn = wholeTrunk && opaque(x, R.y - 3) && opaque(x, R.y + R.h + 2);
        if (trunkColumn || isThread(data[i], data[i + 1], data[i + 2], data[i + 3])) raw[y * W + x] = 1;
      }
    const mask = new Uint8Array(W * H);
    let count = 0;
    for (let y = R.y; y < R.y + R.h; y++)
      for (let x = R.x; x < R.x + R.w; x++) {
        let hit = 0;
        for (let dy = -2; dy <= 2 && !hit; dy++) for (let dx = -2; dx <= 2 && !hit; dx++) hit = raw[(y + dy) * W + (x + dx)];
        if (hit) { mask[y * W + x] = 1; count++; }
      }
    return { mask, count };
  };
  const layer = async (R, mask, file) => {
    const out = Buffer.alloc(R.w * R.h * 4);
    for (let y = 0; y < R.h; y++)
      for (let x = 0; x < R.w; x++) {
        const X = R.x + x, Y = R.y + y, i = idx(X, Y), o = (y * R.w + x) * 4;
        if (mask[Y * W + X]) for (let c = 0; c < 4; c++) out[o + c] = data[i + c];
      }
    await sharp(out, { raw: { width: R.w, height: R.h, channels: 4 } }).png().toFile(file);
  };
  // "mean": blend the two neighbours (bark under the band). "nearest": copy the closer one, so the trunk's
  // edge stays crisp where the ends hung half over it and half over the transparent ground.
  const inpaint = (buf, R, mask, dirs, mode) => {
    const sample = (x, y, dx, dy) => {
      for (let k = 1; k <= 60; k++) {
        const X = x + dx * k, Y = y + dy * k;
        if (X < 0 || Y < 0 || X >= W || Y >= H) return null;
        if (!mask[Y * W + X]) return { i: idx(X, Y), k };
      }
      return null;
    };
    for (let y = R.y; y < R.y + R.h; y++)
      for (let x = R.x; x < R.x + R.w; x++) {
        if (!mask[y * W + x]) continue;
        const picks = dirs.map(([dx, dy]) => sample(x, y, dx, dy)).filter((p) => p !== null);
        if (!picks.length) continue;
        const o = idx(x, y);
        // Reads from buf, so a region filled earlier (the band) is what a later one (the ends) sees above it.
        if (mode === "nearest") {
          const p = picks.reduce((a, b) => (b.k < a.k ? b : a));
          for (let c = 0; c < 4; c++) buf[o + c] = buf[p.i + c];
        } else {
          for (let c = 0; c < 4; c++) buf[o + c] = Math.round(picks.reduce((s, p) => s + buf[p.i + c], 0) / picks.length);
        }
      }
  };

  // Bark for the trunk under the band: blend the rows just above and below across the gap (no streaks), then add
  // the texture of the bark further down (its high-frequency detail), so the fill reads as paint, not as a smear.
  const bandFill = (buf, mask, below) => {
    const top = BAND.y - 1;
    const box = (x, y) => {
      const acc = [0, 0, 0, 0];
      let n = 0;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const i = idx(X, Y);
          for (let c = 0; c < 4; c++) acc[c] += data[i + c];
          n++;
        }
      return acc.map((v) => v / n);
    };
    for (let x = BAND.x; x < BAND.x + BAND.w; x++) {
      // The first clean row below the band in this column: past the loose ends, which hang below the knot.
      let bottom = BAND.y + BAND.h;
      while (bottom < H - 1 && below[bottom * W + x]) bottom++;
      if (!opaque(x, top) || !opaque(x, bottom)) continue;
      const a = idx(x, top), b = idx(x, bottom);
      const above = smooth ? box(x, top - 3) : [data[a], data[a + 1], data[a + 2]];
      const under = smooth ? box(x, bottom + 3) : [data[b], data[b + 1], data[b + 2]];
      for (let y = BAND.y; y < BAND.y + BAND.h; y++) {
        if (!mask[y * W + x]) continue;
        const t = (y - top) / (bottom - top);
        // Texture comes from the bark above the band as luminance only, so no colour (foliage, thread) can bleed in.
        const sy = y - BAND.h - 8;
        const src = idx(x, sy);
        const mean = box(x, sy);
        const lum = (r, g, bl) => 0.299 * r + 0.587 * g + 0.114 * bl;
        const detail = sy > 0 ? Math.max(-40, Math.min(40, lum(data[src], data[src + 1], data[src + 2]) - lum(mean[0], mean[1], mean[2]))) : 0;
        const o = idx(x, y);
        for (let c = 0; c < 3; c++) {
          const base = above[c] * (1 - t) + under[c] * t;
          buf[o + c] = Math.max(0, Math.min(255, Math.round(base + 0.85 * detail)));
        }
        buf[o + 3] = 255;
      }
    }
  };
  const band = maskFor(BAND, true);
  const bandOnly = maskFor(BAND, false);
  const ends = maskFor(ENDS, false);
  await layer(BAND, bandOnly.mask, `public/images/${base.replace("tree-cutout", "thread-band")}${suffix}.png`);
  await layer(ENDS, ends.mask, `public/images/${base.replace("tree-cutout", "tassel")}${suffix}.png`);
  const out = Buffer.from(data);
  inpaint(out, BAND, band.mask, bandDirs, bandFillMode);
  bandFill(out, band.mask, ends.mask);
  // The trunk's edge runs almost vertically through the ends, so fill them from above and below to keep it crisp.
  inpaint(out, ENDS, ends.mask, endsDirs, "nearest");
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 95 }).toFile(`public/images/${base}${suffix}.webp`);
  console.log(`${frame} ${variant}: band ${band.count} px, ends ${ends.count} px lifted`);
}

for (const frame of Object.keys(FRAMES)) {
  await run(frame, "dark");
  await run(frame, "light");
}
