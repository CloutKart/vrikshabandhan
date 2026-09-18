<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes

- Read `docs/superpowers/specs/2026-09-16-redesign-design.md` before changing the design: it records the palette
  tokens (both themes), typography, copy rules (no middle dots, no em dashes, sentence case), the motion budget and
  the accessibility floor. `docs/deploy.md` covers Supabase and Vercel.
- Colours are tokens in `src/styles/tokens.css`; components use the generated utilities (`bg-ground`, `text-ink`,
  `text-sutra` ...), never raw hex. `tests/unit/tokens.contrast.test.ts` enforces the WCAG pairs.
- Every visible string lives in `messages/en.json` and `messages/hi.json` with identical keys.
- Motion lives in `src/lib/motion/site.ts`, loaded only through `MotionRoot`; markup opts in with data attributes
  (`data-reveal`, `data-title-reveal`, `data-hero-title`, `data-story-row`, `data-flip-id`, `data-site-header`). Initial hidden states exist
  only under `html[data-motion="full"]`.
- The newsletter lives in `src/lib/newsletter/` (pure renderer, sending, strings) with its migration in
  `supabase/migrations/0004_newsletter.sql`; `docs/superpowers/specs/2026-09-18-newsletter-design.md` records the
  design. It is off without `RESEND_API_KEY`, `NEWSLETTER_SECRET` and `NEWSLETTER_FROM`, and tests run without them.
- Story text is a line-based plain-text format parsed by `src/lib/content/markup.ts` (headings, quotes, lists,
  photos, films, bold, italic, links); `docs/superpowers/specs/2026-09-18-story-editor-design.md` records it. The
  admin's document editor (`src/components/admin/StoryEditor.tsx`, Tiptap, loaded only in the admin) reads and
  writes that format through `src/lib/editor/doc.ts`; the story page and the mail render from the same parser.
- Checks before pushing: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run e2e`, `npm run check:bundle`.
