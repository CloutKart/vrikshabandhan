import { redirect } from "next/navigation";
import { serverClient } from "./server";

/** The signed-in editor, or a redirect to the login page (with a reason when the account is not an editor). */
export async function requireEditor(): Promise<{ email: string }> {
  const sb = await serverClient();
  if (!sb) redirect("/admin/login");
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) redirect("/admin/login");
  const { data } = await sb.from("editors").select("email").eq("email", user.email.toLowerCase()).maybeSingle();
  if (!data) redirect("/admin/login?denied=1");
  return { email: user.email };
}
