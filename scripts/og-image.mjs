/**
 * The share image: the painting on the cream canvas, 1200x630, for Open Graph and Twitter cards.
 *   node scripts/og-image.mjs
 * Reads public/images/canvas-light.jpg and assets/painting/tree-cutout-light.webp (the tree with its thread) and
 * writes public/images/og.jpg.
 */
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

const tree = await sharp("assets/painting/tree-cutout-light.webp").toBuffer();
const painting = await sharp("public/images/canvas-light.jpg").composite([{ input: tree, left: 0, top: 0 }]).toBuffer();
const scaled = await sharp(painting).resize({ width: WIDTH }).toBuffer();
const { height } = await sharp(scaled).metadata();
// Keep the trunk and knot: crop a little below the middle.
const top = Math.max(0, Math.round(((height ?? HEIGHT) - HEIGHT) * 0.6));
await sharp(scaled).extract({ left: 0, top, width: WIDTH, height: HEIGHT }).jpeg({ quality: 86 }).toFile("public/images/og.jpg");
console.log(`public/images/og.jpg ${WIDTH}x${HEIGHT}`);
