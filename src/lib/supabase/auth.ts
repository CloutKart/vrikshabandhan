import { redirect } from "next/navigation";
import { serverClient } from "./server";

type Client = NonNullable<Awaited<ReturnType<typeof serverClient>>>;

/** True when the signed-in user's address is on the editor list, whatever its case. */
export async function isEditor(sb: Client, email: string): Promise<boolean> {
  const { data } = await sb.from("editors").select("email").ilike("email", email).maybeSingle();
  return Boolean(data);
}

/** The signed-in editor and a cookie-aware client, or a redirect to the login page (with a reason when the account is not an editor). */
export async function requireEditor(): Promise<{ email: string; sb: Client }> {
  const sb = await serverClient();
  if (!sb) redirect("/admin/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) redirect("/admin/login");
  if (!(await isEditor(sb, user.email))) redirect("/admin/login?denied=1");
  return { email: user.email, sb };
}
