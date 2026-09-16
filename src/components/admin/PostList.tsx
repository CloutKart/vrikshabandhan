import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { PostRow } from "@/lib/supabase/types";
import { formatStoryDate } from "@/lib/i18n/format";

type Show = "all" | "live" | "draft" | "deleted";

const filters: Array<[Show, string]> = [
  ["all", "All"],
  ["live", "Live"],
  ["draft", "Drafts"],
  ["deleted", "Deleted"],
];

function matches(p: PostRow, show: Show) {
  if (show === "deleted") return p.deleted_at !== null;
  if (p.deleted_at) return false;
  if (show === "live") return p.live;
  if (show === "draft") return !p.live;
  return true;
}

function status(p: PostRow) {
  if (p.deleted_at) return "Deleted";
  return p.live ? "Live" : "Draft";
}

export function PostList({ posts, show }: { posts: PostRow[]; show: Show }) {
  const visible = posts.filter((p) => matches(p, show));
  return (
    <main id="content" className="page py-16 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-serif text-[2.5rem] leading-tight">Posts</h1>
        <Button href="/admin/posts/new">New post</Button>
      </div>
      <nav aria-label="Show" className="mt-8 flex gap-6">
        {filters.map(([key, label]) => (
          <Link key={key} href={key === "all" ? "/admin" : `/admin?show=${key}`} className="u-thread inline-flex min-h-11 items-center" aria-current={show === key ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      {visible.length ? (
        <ol className="mt-4 divide-y divide-moss/40">
          {visible.map((p) => (
            <li key={p.id} className="grid gap-1 py-4 min-[820px]:grid-cols-[10rem_1fr_6rem] min-[820px]:gap-6">
              <span className="text-sm text-ink-2">{formatStoryDate(p.date, "en")}</span>
              <Link href={`/admin/posts/${p.id}`} className="u-thread justify-self-start font-serif text-xl">
                {p.title_en || "(untitled)"}
              </Link>
              <span className="text-sm text-ink-2">{status(p)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 text-ink-2">
          Nothing here yet. The three built-in stories are part of the site itself; posts you add here appear above them.
        </p>
      )}
    </main>
  );
}
