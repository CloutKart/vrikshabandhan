/**
 * Fails when a prerendered page references the GSAP chunk. The motion module
 * must only load through MotionRoot's dynamic import, after hydration.
 *   node scripts/check-bundle.mjs   (after `next build`)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const chunksDir = ".next/static/chunks";
const gsapChunks = readdirSync(chunksDir)
  .filter((f) => f.endsWith(".js"))
  .filter((f) => /SplitText|Flip/.test(readFileSync(join(chunksDir, f), "utf8")));
if (!gsapChunks.length) {
  console.error("No GSAP chunk found; is the build current?");
  process.exit(1);
}

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith(".html")) yield p;
  }
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const offenders = [];
let report = "";
for (const file of htmlFiles(".next/server/app")) {
  const html = readFileSync(file, "utf8");
  for (const g of gsapChunks) if (html.includes(g)) offenders.push(`${file} -> ${g}`);
  if (file.endsWith("/en.html")) {
    const scripts = [...html.matchAll(/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]);
    const bytes = [...new Set(scripts)].reduce((n, s) => n + statSync(join(".next", s)).size, 0);
    report = `First-load JS for /en (uncompressed, ${new Set(scripts).size} files): ${kb(bytes)}`;
  }
}
console.log(`GSAP chunk(s): ${gsapChunks.map((g) => `${g} (${kb(statSync(join(chunksDir, g)).size)})`).join(", ")}`);
if (report) console.log(report);
if (offenders.length) {
  console.error("GSAP is referenced by prerendered HTML:\n" + offenders.join("\n"));
  process.exit(1);
}
console.log("OK: GSAP loads only on demand.");
