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
- Checks before pushing: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run e2e`, `npm run check:bundle`.
