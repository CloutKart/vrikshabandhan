import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/Toast";
import { mukta, muktaDevanagari, tiro, tiroItalic } from "@/lib/fonts";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { serverClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, THEME_COLORS } from "@/lib/theme/constants";
import { THEME_HEAD_SCRIPT } from "@/lib/theme/head-script";
import { signOut } from "./actions";
import "@/styles/globals.css";

export const metadata: Metadata = { title: "Editor", robots: { index: false, follow: false } };

/** Second root layout: the editor lives outside the locale routes and is English-only. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const configured = Boolean(publicSupabaseEnv());
  const sb = configured ? await serverClient() : null;
  const signedIn = sb ? Boolean((await sb.auth.getUser()).data.user) : false;
  return (
    <html lang="en" data-theme={DEFAULT_THEME} className={`${tiro.variable} ${tiroItalic.variable} ${mukta.variable} ${muktaDevanagari.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={THEME_COLORS[DEFAULT_THEME]} />
        <script dangerouslySetInnerHTML={{ __html: THEME_HEAD_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <header className="page flex min-h-[var(--header-h)] items-center justify-between gap-6 font-sans">
          <Link href="/admin" className="text-lg">
            Vrikshabandhan editor
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/en" className="u-thread">
              View site
            </Link>
            {signedIn ? (
              <form action={signOut}>
                <button type="submit" className="u-thread min-h-11">
                  Sign out
                </button>
              </form>
            ) : null}
          </nav>
        </header>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
