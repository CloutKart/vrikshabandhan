import { redirect } from "next/navigation";
import { NotConfigured } from "@/components/admin/NotConfigured";
import { isEditor } from "@/lib/supabase/auth";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { serverClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ denied?: string; error?: string }> }) {
  if (!publicSupabaseEnv()) return <NotConfigured />;
  const { denied, error } = await searchParams;
  // An editor who is already signed in does not need the form.
  const sb = await serverClient();
  const user = sb ? (await sb.auth.getUser()).data.user : null;
  if (sb && user?.email && !denied && (await isEditor(sb, user.email))) redirect("/admin");
  return (
    <main id="content" className="page py-24">
      <h1 className="text-[2.5rem] leading-tight">Sign in to the editor</h1>
      <p className="mt-4 max-w-[50ch] text-ink-2">Only e-mail addresses on the editor list can sign in. There is no password: a link arrives by e-mail.</p>
      {denied ? (
        <p role="alert" className="mt-6 max-w-[50ch] text-sutra">
          This account signed in, but it is not on the editor list. Ask an existing editor to add it.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-6 max-w-[50ch] text-sutra">
          The sign-in link did not work ({error}). Links expire after a while and work once, and must be opened in the same browser that asked for them. Ask for a new one below.
        </p>
      ) : null}
      <div className="mt-10">
        <LoginForm />
      </div>
    </main>
  );
}
