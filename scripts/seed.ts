/**
 * Upsert the built-in posts into Supabase by slug.
 *   npx tsx scripts/seed.ts --dry-run     print what would be written
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed.ts
 * Needs NEXT_PUBLIC_SUPABASE_URL and, for a real run, the service-role key (never ship it to the browser).
 */
import { createClient } from "@supabase/supabase-js";
import { builtinPosts } from "../src/lib/content/builtin";
import type { Post } from "../src/lib/content/types";
import type { PostInsert } from "../src/lib/supabase/types";

function toRow(p: Post): PostInsert {
  return {
    slug: p.slug,
    title_en: p.title_en,
    title_hi: p.title_hi,
    summary_en: p.summary_en,
    summary_hi: p.summary_hi,
    body_en: p.body_en,
    body_hi: p.body_hi,
    date: p.date,
    place: p.place,
    tags: p.tags,
    yt: p.yt,
    media: p.media,
    live: p.live,
    newsletter_sent_at: new Date().toISOString(),
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const rows = builtinPosts.map(toRow);

  if (dryRun) {
    for (const r of rows) console.log(`${r.slug}\t${r.date}\t${r.title_en}`);
    console.log(`${rows.length} rows (dry run)`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --dry-run.");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("posts").upsert(rows, { onConflict: "slug" });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`${rows.length} rows upserted`);
}

main();
