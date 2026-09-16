# Vrikshabandhan Abhiyan

The website of Vrikshabandhan Abhiyan (Regd.), Dehradun: a Himalayan movement that ties a raksha sutra round a
tree and keeps the promise to protect it. English and Hindi, dark and light, with stories the Abhiyan edits itself.

- Next.js 16 (App Router), Tailwind 4, next-intl for `/en` and `/hi`, Supabase for stories and the editor, GSAP for
  the few moments that move.
- Design spec: `docs/superpowers/specs/2026-09-16-redesign-design.md`. Implementation plan and status:
  `docs/superpowers/plans/2026-09-16-redesign.md`. Deployment: `docs/deploy.md`.

```
npm install
npm run dev          # http://localhost:3000
npm run test         # unit tests
npm run e2e          # build + Playwright (axe, keyboard, motion, screenshots)
```

The site works without Supabase and shows its three built-in stories; the editor at `/admin` needs a configured
project (see `docs/deploy.md`).
