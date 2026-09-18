/** Shown for every admin route while the Supabase environment variables are absent. */
export function NotConfigured() {
  return (
    <main id="content" className="page py-24">
      <h1 className="text-[2.5rem] leading-tight">Editor not configured</h1>
      <p className="mt-6 max-w-[60ch]">
        The editor needs a Supabase project. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, run the
        migrations in supabase/migrations, add editor e-mail addresses to the editors table, and deploy again. The
        public site keeps working without it and shows the built-in stories.
      </p>
      <p className="mt-4 max-w-[60ch] font-sans text-sm text-ink-2">
        The newsletter needs three more variables, RESEND_API_KEY, NEWSLETTER_SECRET and NEWSLETTER_FROM; until they are
        set, publishing mails nobody and the subscribe form on the site says so. See docs/deploy.md for the full runbook.
      </p>
    </main>
  );
}
