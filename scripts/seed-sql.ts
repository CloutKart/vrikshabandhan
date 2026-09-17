/**
 * Print the built-in stories as SQL inserts for the Supabase SQL editor.
 *   npm run seed:sql          writes supabase/seed.sql
 */
import { builtinPosts } from "../src/lib/content/builtin";
import { seedSql } from "../src/lib/content/seed-sql";

process.stdout.write(seedSql(builtinPosts));
