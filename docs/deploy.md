# Deploying the site

The site is a Next.js 16 app. It runs without a database (it then shows the three built-in stories) and gains the
editor and new stories once a Supabase project is attached.

## 1. Supabase

1. Create a project at supabase.com. Note the project URL and the anon key (Project settings, API).
2. Run `supabase/setup.sql` once in the SQL editor (it is the three migrations below plus the editor list, and is
   safe to run again), or with `psql "$DATABASE_URL" -f supabase/setup.sql`. The individual migrations, in order:
   - `supabase/migrations/0001_posts.sql` (posts table)
   - `supabase/migrations/0002_editors_rls.sql` (editor list, row-level security)
   - `supabase/migrations/0003_storage.sql` (the public `media` bucket, 20 MB, JPEG/PNG/WebP/MP4)
3. Add the people who may edit: `insert into public.editors (email) values ('someone@example.com');`
   Only these addresses can sign in (case does not matter). Anyone else who follows a magic link is told they are
   not an editor. If the SQL editor refuses the storage statements, create the `media` bucket and its four policies
   under Storage in the dashboard instead; they are listed in `supabase/migrations/0003_storage.sql`.
4. Authentication, URL configuration: set the Site URL to the public domain and add
   `https://<domain>/admin/auth/callback` to the redirect allow list. Keep the default e-mail magic-link template or
   adjust its wording; the link must point at that callback.
5. Seed the four built-in stories so they become editable (optional): paste `supabase/seed.sql` in the SQL editor.
   It never overwrites a row that already exists. (`npm run seed:sql` regenerates it after the built-in stories
   change.) The Node alternative, `NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed`, upserts
   instead and so does overwrite edits; the service-role key must never reach the browser or Vercel.

## 2. Vercel

1. Import the repository. Framework preset: Next.js. Build command `npm run build`, no overrides needed.
2. Environment variables (Production and Preview):
   - `SITE_URL` = `https://vrikshabandhanabhiyan.in` (no trailing slash). Canonical links, share cards, the
     sitemap and the links inside e-mails are built from it; without it Vercel's production URL is used.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   Without the Supabase pair the site deploys fine and the editor shows "Editor not configured".
3. The domain, vrikshabandhanabhiyan.in. Under Settings, Domains add `vrikshabandhanabhiyan.in` and
   `www.vrikshabandhanabhiyan.in`; at the registrar create an A record for the apex pointing at `76.76.21.21` and a
   CNAME for `www` pointing at `cname.vercel-dns.com`. In Vercel set `www` to redirect to the apex, and once the apex
   is live edit the `vrikshabandhan.vercel.app` entry to redirect to it as well, so the old address keeps working.
   Then in Supabase (Authentication, URL configuration) set the Site URL to `https://vrikshabandhanabhiyan.in` and
   add `https://vrikshabandhanabhiyan.in/admin/auth/callback` to the redirect allow list.
   Search engines: in Google Search Console add the domain property (DNS TXT record), submit
   `https://vrikshabandhanabhiyan.in/sitemap.xml`, and do the same in Bing Webmaster Tools. Every page carries a
   canonical link, hreflang links between its English and Hindi versions, Open Graph and Twitter cards with the
   painting as the share image (stories use their cover), and structured data for the organisation and each story.
4. `next.config.ts` allows images from the Supabase host automatically, derived from `NEXT_PUBLIC_SUPABASE_URL`
   at build time, so the variable must be set before the build runs (it is, on Vercel).

## 3. Publishing flow

- Editors sign in at `/admin/login` with a magic link, then create posts at `/admin/posts/new`.
- Saving calls `revalidateStories()`, which revalidates every public page. Story pages also revalidate on their
  own every 60 seconds.
- Deleting is soft: the post gets a `deleted_at`, the toast offers Undo, and the "Deleted" filter lists it for
  restoring later. Photos stay in storage.
- Before publishing, every photo needs an English description; the editor refuses to publish without one.

## 4. Local development

```
npm install
npm run dev              # http://localhost:3000 -> /en
npm run test             # unit tests (vitest)
npm run e2e              # build, then Playwright against the built site (no Supabase needed)
npm run check:bundle     # after a build: GSAP must not be in any prerendered page
```

Copy `.env.example` to `.env.local` to point a local run at a Supabase project.

## 5. Things the NGO still has to supply

- The painting's artist name and permission (`hero.credit` in `messages/en.json` and `messages/hi.json` stays empty
  until then, and no credit line is shown).
- The One Himalaya blog URL (`involve.blog` is plain text until a link exists).
- Programme numbers for `src/lib/content/numbers.ts`; the "What we have planted" block stays hidden while it is null.
- Event photos: upload them to existing posts through the editor, with descriptions in both languages.
