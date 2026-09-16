import { NotConfigured } from "@/components/admin/NotConfigured";
import { publicSupabaseEnv } from "@/lib/supabase/env";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  if (!publicSupabaseEnv()) return <NotConfigured />;
  const { denied } = await searchParams;
  return (
    <main id="content" className="page py-24">
      <h1 className="text-[2.5rem] leading-tight">Sign in to the editor</h1>
      <p className="mt-4 max-w-[50ch] text-ink-2">Only e-mail addresses on the editor list can sign in. There is no password: a link arrives by e-mail.</p>
      {denied ? (
        <p role="alert" className="mt-6 max-w-[50ch] text-sutra">
          This account signed in, but it is not on the editor list. Ask an existing editor to add it.
        </p>
      ) : null}
      <div className="mt-10">
        <LoginForm />
      </div>
    </main>
  );
}
