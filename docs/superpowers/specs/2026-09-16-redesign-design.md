# Vrikshabandhan website redesign: design spec (2026-09-16)

## Context

The owner's verdict on the v2 single-file site: "looks really bad and AI generated". An audit against the
frontend-design, web-design-guidelines and Bencium skills confirmed it, with specifics:

- 13 occurrences of middle-dot meta strings ("1730 · Khejarli"), the single red word in the headline, the cream +
  serif display + clay accent stack, 16 "WORD — fragment" constructions, a three-card "ways to help" triptych, one
  border radius on nine unrelated things, a tie-mark motif stamped on every heading, placeholder copy shipped live.
- Almost no feedback motion (one 200 ms toast fade) while the only two animations are decorative scroll parallaxes,
  one of which ignores reduced motion. Nothing responds to hover, press, open or save.
- Real accessibility failures: gold focus ring at 2.3:1 on the light ground, invisible 1.4:1 borders, every uploaded
  photo with empty alt, admin labels not associated, dialogs without focus management, touch targets under 44 px,
  Hindi fragments without `lang`, stories not deep-linkable. Plus a bug: every tag filter except "All" is broken
  (unescaped quotes in an inline `onclick`).
- Neither Fraunces nor Spectral has Devanagari glyphs, so Hindi silently falls back to Mukta with no match.

What survives from v2 because it is genuinely good: the attribute-level bilingual mechanism (as an idea; it becomes
locale routes), the three-layer painting hero sized in container units, the fixed red thread with a scroll-following
knot (the best idea on the page, and load-bearing layout, not decoration), the dark-mode token discipline, the
reduced-motion handling, and the sourced content (three posts, lineage, timeline, contact details).

Decisions made with the owner in this session:

| Decision | Choice |
|---|---|
| Build target | Next.js 16 App Router + Supabase, deployed to Vercel (the v2 README's stated destination) |
| Direction | Deep green, typographic, painting-led. No cards. Red thread as the only line device. Full-bleed photos. |
| Imagery | Drop the two AI stock photos. Real assets only: the painting, the founder portrait, event photos when supplied. |
| Typography | Tiro Devanagari Hindi (one serif for both scripts, regular weight, size-driven hierarchy) + Mukta for UI |
| Theme | Dark green default AND a light theme, with a toggle like v2 |
| Motion | Rich but concentrated: one orchestrated load moment, the thread and knot, purposeful feedback everywhere |

Intended outcome: a site that reads as designed for this movement, in both scripts, with motion that answers the
visitor, that the NGO can edit itself, and that passes an accessibility audit.

## Design spec

### Palette (primitive → semantic tokens; components never use hex)

Dark (default): ground `#12211A`, ground-2 `#1A221D`, ink `#EDEFE8`, ink-2 `#AAB2AB`, sutra red `#C8322B` (thread,
knots, underlines, primary action; never body text), gold `#E0B347` (dates, numerals, focus ring), moss `#2E3A32`
rules, paper `#F3EEE2` reading sheets with paper-ink `#1D231E`.
Light: ground `#E4EAE1` (pale sage, deliberately not cream), ground-2/moss `#D5DDD1`, ink `#10231A`, ink-2 `#3E4F45`,
sutra `#B4231D`, gold `#9C7414`, paper `#F7F4EA`, paper-ink `#10231A`. A unit test parses `tokens.css` and asserts
the pairs: ink/ground ≥ 7:1, ink-2/ground ≥ 4.5:1, gold/ground ≥ 3:1 (focus), sutra/ground ≥ 3:1, paper-ink/paper
≥ 7:1, in both themes. Grain overlay at 0.06 opacity on both grounds.
Theme: `data-theme` on `<html>`, defaults to dark, honours a stored choice, `color-scheme` and `theme-color` set.

### Typography

- Tiro Devanagari Hindi 400 and 400 italic, loaded via `next/font/google` twice (`latin`, `devanagari` subsets).
  Display headlines show both languages: the current locale first, the other beneath at 0.55× with its own `lang`.
  Devanagari lines get 0.92× the English size and 1.25 line-height (matras need it). Hierarchy by size, not weight:
  hero `clamp(3rem, 9vw, 8.5rem)`, page title 3.5–5 rem, section 2.25 rem, body 1.125 rem / 1.7, reading column 65ch.
- Mukta 400/500 for navigation, chips, form labels, dates. No all-caps, no tracked-out labels, no eyebrows.
- Copy rules: sentence case; comma or line break instead of middle dots ("11 December 2023, Dehradun"); no em dashes;
  no epigrams or "X is not Y, it is Z" cadence; CTAs say what happens ("Read the letter", "Send a photo").

### Layout

- 12-column grid, 1440 max, with the thread gutter on the left (thread fixed at 28 px, content starts at 64 px on
  desktop; thread hidden under 820 px as in v2). Asymmetric: text left, images bleed right or full width.
- Hero: the painting shown whole (16:9, ≤86vh) with the headline tucked under the leaves as in v2, cutout tree in
  front. Under it, in the first screen on desktop, the three latest stories as a list (date and place, title in both
  scripts, cover thumb), no cards.
- Lists everywhere instead of cards: story rows, the three ways to help, the lineage, the timeline. Rows are
  separated by space, and the thread's knot slides to the row under the pointer or keyboard focus.
- Reading pages: a paper sheet centred on the ground, 65ch, cover image above the title, body via
  `@tailwindcss/typography`, YouTube and gallery below.
- Routes: `/[locale]` home; `/[locale]/stories` (chips as `?tag=` search param); `/[locale]/stories/[slug]`;
  `/[locale]/founder`; `/[locale]/thread` (why a thread, lineage, an impact-numbers block hidden until real data
  exists); `/[locale]/get-involved` (adopt, host, support, contact). `/admin` outside the locale segment.

### Motion system (tokens + nine moments, all collapsing to final state under reduced motion)

Tokens: durations 100/150/200/300/500/900 ms; easings entrance `cubic-bezier(0,0,.2,1)`, exit `(.4,0,1,1)`,
transition `(.4,0,.2,1)`, GSAP `expo.out` / `power2.out` / `none` for scrub; stagger 15 ms chars, 30 ms lists,
60 ms grids; distances 4 px lift, 12–24 px reveal, scale .98 press. Transform and opacity only.

1. **Load, once per session:** the thread draws down the left edge (SVG `stroke-dashoffset`, 900 ms), then the
   headline characters rise (GSAP SplitText, y 20, rotateX −40, 15 ms stagger, `expo.out`; Hindi split by words,
   never characters, to keep conjuncts intact) while the cutout leaves fade in. Whole sequence ≤ 1.2 s.
2. **Knot follows scroll** (ScrollTrigger scrub 0.6, no layout reads per frame) and **slides to the hovered or
   focused list row**.
3. **Photo reveal**: `clip-path` inset opens once on viewport entry, CSS only.
4. **Story link hover/focus**: a red underline draws left to right like thread (pseudo-element `scaleX`).
5. **Chips and buttons**: 150 ms colour and 1 px lift, press scale .98, always with a matching reverse.
6. **Language switch**: 150 ms out / 200 ms in crossfade with reserved height; it is a route change to the other
   locale.
7. **Card to story**: GSAP Flip shared-cover morph on navigation, crossfade fallback.
8. **Founder timeline**: the one fade-up stagger on the site (y 24, 80 ms).
9. **Save, delete-with-undo, errors**: toast slides in with `role="status"`; error field shakes 4 px, never colour alone.
10. **Page titles arrive as words** (the owner asked for typography animation): every page and story title runs a
    lighter version of the hero moment on load, SplitText by words, y 16, 30 ms stagger, `power2.out`, ≤ 600 ms.
    One typographic system: the hero arrives as characters, everything else as words.
11. **Bilingual heading pairs**: on viewport entry, once, the second-language line rises 12 px under the first with
    a 120 ms delay, so the pairing itself is what animates. Section headings only, never body text.

### Content model and admin

`posts`: id, slug, title_en, title_hi, summary_en, summary_hi, body_en, body_hi (optional), date, place, tags[],
yt, media[] of {path, type, alt_en, alt_hi}, live, deleted_at, timestamps. Body keeps v2's mini-markup ("## ",
"> ", one paragraph per line) so the three existing posts seed unchanged. Supabase Storage bucket `media`. RLS: anon
reads live and not deleted; authenticated editors write. Admin at `/admin`: magic-link sign-in, list, editor with
both-language fields and an alt-text field per media item, draft/live, soft delete with undo.

### Accessibility floor (non-negotiable, verified by the AccessLint plugin and Playwright)

Focus ring 3:1 on every ground; associated labels; dialogs with focus trap and restore, Escape, `inert` background;
no `div onclick`; 44 px targets; `lang` on every Hindi fragment; alt text on every media item; skip link;
`scroll-margin-top`; heading order; stories deep-linkable; `prefers-reduced-motion` honoured by every moment above.

### Out of scope for this plan

A tree-registration database, donations processing, an events calendar, newsletter. Each is its own brainstorm.

> Housekeeping carried into the first implementation task: add a root `.gitignore` with `__pycache__/`,
> `node_modules/`, `.next/`, `.env*.local` and `.claude/settings.local.json`. The research run left
> `.claude/skills/ui-ux-pro-max/scripts/__pycache__/` untracked; it must be ignored, not committed.

