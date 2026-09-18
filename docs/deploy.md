# Deploying the site

The site is a Next.js 16 app. It runs without a database (it then shows the four built-in stories) and gains the
editor, new stories and the newsletter once a Supabase project and a mail service are attached.

## 1. Supabase

1. Create a project at supabase.com. Note the project URL and the anon key (Project settings, API).
2. Run `supabase/setup.sql` once in the SQL editor (it is the four migrations below plus the editor list, and is
   safe to run again), or with `psql "$DATABASE_URL" -f supabase/setup.sql`. The individual migrations, in order:
   - `supabase/migrations/0001_posts.sql` (posts table)
   - `supabase/migrations/0002_editors_rls.sql` (editor list, row-level security)
   - `supabase/migrations/0003_storage.sql` (the public `media` bucket, 20 MB, JPEG/PNG/WebP/MP4)
   - `supabase/migrations/0004_newsletter.sql` (subscribers, deliveries, the once-only mark on posts, and the
     secret-gated functions the site calls; see section 6 for the secret it needs)
   Then check Project settings, API, "Exposed schemas": it must list only `public` and `graphql_public`. The
   `private` schema holds the newsletter secret and must never be exposed.
3. Add the people who may edit: `insert into public.editors (email) values ('someone@example.com');`
   Only these addresses can sign in (case does not matter). Anyone else who follows a magic link is told they are
   not an editor. If the SQL editor refuses the storage statements, create the `media` bucket and its four policies
   under Storage in the dashboard instead; they are listed in `supabase/migrations/0003_storage.sql`.
4. Authentication, URL configuration: set the Site URL to the public domain and add
   `https://<domain>/admin/auth/callback` to the redirect allow list. Keep the default e-mail magic-link template or
   adjust its wording; the link must point at that callback.
5. Seed the four built-in stories so they become editable (optional): paste `supabase/seed.sql` in the SQL editor.
   It never overwrites a row that already exists, and seeded stories count as already mailed, so an editor's first
   save of one never sends it to subscribers. (`npm run seed:sql` regenerates it after the built-in stories
   change.) The Node alternative, `NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed`, upserts
   instead and so does overwrite edits; the service-role key must never reach the browser or Vercel.

## 2. Vercel

1. Import the repository. Framework preset: Next.js. Build command `npm run build`, no overrides needed.
2. Environment variables (Production and Preview):
   - `SITE_URL` = `https://vrikshabandhanabhiyan.in` (no trailing slash). Canonical links, share cards, the
     sitemap and the links inside e-mails are built from it; without it Vercel's production URL is used.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`, `NEWSLETTER_SECRET`, `NEWSLETTER_FROM` and, at first, `NEWSLETTER_TEST_TO` (section 6)
   Without the Supabase pair the site deploys fine and the editor shows "Editor not configured". Without the
   newsletter values the site deploys fine, the subscribe form says subscriptions are not open yet, and publishing
   mails nobody. `SUPABASE_SERVICE_ROLE_KEY` is never set on Vercel; nothing on the site needs it.
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
- Writing a story. The text is a document editor: a page-like sheet with a toolbar (Bold, Italic, Subheading,
  Quote and its Source, Bullets, Numbers, Link, Photo, Film, Undo, Redo) and the usual shortcuts (Ctrl+B, Ctrl+I,
  Ctrl+K for a link, Ctrl+Z). One language shows at a time; the English / हिंदी switch above the sheet keeps both.
  Pasting from Word or Google Docs keeps headings, bold, italic, links and lists and drops fonts, colours and
  sizes. Photos are placed in the text from the story's uploads (upload first, under "Photos and videos", so each
  has a description), with an optional caption; films are placed from a YouTube link. What is saved is plain text
  in the story format described in `docs/superpowers/specs/2026-09-18-story-editor-design.md`, so older stories
  need no change and the newsletter renders the same text.
- Unsaved work is copied to the browser every two seconds. Reopening a story on the same device after a closed tab
  or a dropped connection offers "Restore them" or "Discard"; a successful save clears the copy.
- Before publishing, every photo needs an English description, and a photo placed in the text must still be among
  the uploads; the editor refuses to publish otherwise.
- The first time a story goes live, every confirmed subscriber gets it by e-mail in their language, once. Editing a
  live story, unpublishing and republishing it, or saving it again never mails it again. The toast after saving
  says how many were reached; the story page shows the send state, lists any address that failed, and offers
  "Retry the failed" and "Send me a preview" (both editions to your own inbox, marked as a preview).

## 4. Local development

```
npm install
npm run dev              # http://localhost:3000 -> /en
npm run test             # unit tests (vitest)
npm run e2e              # build, then Playwright against the built site (no Supabase needed)
npm run check:bundle     # after a build: GSAP must not be in any prerendered page
```

Copy `.env.example` to `.env.local` to point a local run at a Supabase project.

## 5. Newsletter

Readers subscribe from the footer of every page, from the stories page, or from the invitation that appears once
on a story page. They get a confirmation mail with a button (double opt-in); every story mail carries an
unsubscribe link and the one-click unsubscribe headers Gmail and Yahoo use. Subscribers live in the `subscribers`
table; only editors can read it, and only the site's own functions can write to it.

1. Mail service. Create an account at resend.com with the Abhiyan's address, add an API key with sending access
   only, and switch off open and click tracking (Settings) so the mails carry no tracking pixels.
2. Secret. Run `openssl rand -hex 32`, set it on Vercel as `NEWSLETTER_SECRET`, and store the same value in the
   database: `insert into private.newsletter_config (key, value) values ('secret', '<the value>') on conflict (key)
   do update set value = excluded.value;`. Check it: `select * from public.newsletter_subscribe('wrong', 'a@b.co',
   'en', '1.1.1.1');` must fail with "newsletter: not allowed".
3. Test mode first. On Vercel set `NEWSLETTER_FROM=onboarding@resend.dev` and `NEWSLETTER_TEST_TO=<your own
   address>` (the address the Resend account was made with; Resend delivers only there before a domain is
   verified). Redeploy. Then walk the loop: subscribe from the footer, open the confirmation mail (its subject
   starts with "[Test for ...]"), press the button; publish a draft with a photo and a Hindi title and expect the
   toast "Published. Test mode: ..." and two mails, one per language; press Unsubscribe in the mail and the button
   on the page. The admin list shows that story as "Live, test mailed".
4. Go live. In Resend add `vrikshabandhanabhiyan.in`, publish the DKIM and SPF records it shows at the registrar,
   add a DMARC record (`_dmarc` TXT `v=DMARC1; p=none; rua=mailto:VrikshabandhanAbhiyan@gmail.com`), wait for
   Verified, set `NEWSLETTER_FROM=stories@vrikshabandhanabhiyan.in`, delete `NEWSLETTER_TEST_TO`, redeploy. Stories
   published during test mode were not mailed to anyone; each one's page now shows "Send to N subscribers", which
   sends it once. Mark the first real mails "Not spam" in a Gmail and a Yahoo inbox, and keep the From address as it
   is from then on.
5. Support. Useful SQL: `select email, locale, confirmed_at, unsubscribed_at from public.subscribers order by
   created_at desc;` to list; `update public.subscribers set unsubscribed_at = now() where email = '<address>';`
   to stop someone's mails on request; `delete from public.subscribers where email = '<address>';` to erase them.
   A deliberate second send of a story is SQL only: `update public.posts set newsletter_sent_at = null,
   newsletter_test = false where slug = '<slug>'; delete from public.newsletter_deliveries where post_id = (select
   id from public.posts where slug = '<slug>');` then save the story once in the editor.
6. Limits. Resend's free tier allows 100 mails a day and 3,000 a month; move to a paid plan before the list nears
   90 confirmed subscribers. Bounces and complaints are not processed automatically yet; Resend's dashboard lists
   them, and the SQL above removes an address. Test mode restricts previews to the owner's own address.

## 6. Things the NGO still has to supply

- The painting's artist name and permission (`hero.credit` in `messages/en.json` and `messages/hi.json` stays empty
  until then, and no credit line is shown).
- The One Himalaya blog URL (`involve.blog` is plain text until a link exists).
- Programme numbers for `src/lib/content/numbers.ts`; the "What we have planted" block stays hidden while it is null.
- Event photos: upload them to existing posts through the editor, with descriptions in both languages.
