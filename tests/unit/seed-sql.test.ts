import { describe, expect, it } from "vitest";
import { builtinPosts } from "@/lib/content/builtin";
import { seedSql } from "@/lib/content/seed-sql";

describe("seedSql", () => {
  const sql = seedSql(builtinPosts);
  it("writes one insert per built-in story that never overwrites an edited row", () => {
    expect(sql.match(/insert into public\.posts/g)).toHaveLength(builtinPosts.length);
    expect(sql.match(/on conflict \(slug\) do nothing;/g)).toHaveLength(builtinPosts.length);
    for (const p of builtinPosts) expect(sql).toContain(`$vb$${p.slug}$vb$`);
  });
  it("carries the media, the film link and the live flag", () => {
    expect(sql).toContain("seed-bombers-2023.jpg");
    expect(sql).toContain("https://youtu.be/XTmHXvDXcI0");
    expect(sql).toContain("::jsonb,\n  true");
    expect(sql).toContain("true,\n  now()");
  });
});
