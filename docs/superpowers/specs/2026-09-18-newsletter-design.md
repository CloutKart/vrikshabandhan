# Newsletter design (2026-09-18)

The redesign spec deferred the newsletter to its own brainstorm. This is it, as built.

## What it is

A reader can subscribe to the stories from the footer of every page, from a paper panel on the stories page, or
from one invitation on a story page. Subscribing is double opt-in: a confirmation mail with a button. When a story
is published for the first time, every confirmed subscriber gets the whole story by e-mail in their language,
with a link to the site, once, ever. Every story mail carries an unsubscribe link and RFC 8058 one-click headers.

## The invitation

A native dialog (the phone menu's pattern: platform focus trap, Escape, inert background, focus restore) that opens
once per visitor, only on story pages, only after reading: the reader reached the end of the story, or twelve
seconds passed with the story scrolled at least two fifths. Never over the open phone menu, never in a hidden
tab, never when storage is blocked, never again once seen or subscribed (`va-newsletter` in localStorage). A panel
on desktop, a bottom sheet under 820 px, a 12 px rise under full motion only.

## Data

`supabase/migrations/0004_newsletter.sql`: `subscribers` (editors read and update; nobody inserts through the API),
`newsletter_deliveries` (who got which story, with the provider id or the error), `posts.newsletter_sent_at` and
`posts.newsletter_test` (the once-only mark), a `private` schema holding the shared secret and the rate-limit
attempts, and three security-definer functions gated by the secret: subscribe (rate limits, throttle, hashed
48-hour confirmation token), confirm (single use) and unsubscribe (idempotent). No service-role key anywhere.

## Sending

`PostEditor.save()` calls `sendStoryNewsletter` after every live save; the database decides. The claim is one
`update ... where live and newsletter_sent_at is null returning *`; zero rows means already sent, a draft, or a
race lost. Recipients are rendered once per language (`src/lib/newsletter/render.ts`, plain HTML tables, the
light palette from tokens.css), personalised per copy, sent in batches of 100 through Resend with idempotency
keys, recorded in the deliveries log; failures never turn a saved post into an error, and "Retry the failed"
sends again only to rows that failed. Test mode (`NEWSLETTER_TEST_TO`) sends both editions to the owner alone and
records the story as test-mailed; after go-live the story page offers one deliberate "Send to N subscribers".

## Copy

The `newsletter` namespace in both message files. Sentence case, no middle dots, no em dashes, "e-mail" hyphenated,
buttons say what happens ("Send me a confirmation link", "Confirm my subscription", "Stop the e-mails").
