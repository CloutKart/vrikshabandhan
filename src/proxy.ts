import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except the admin, Next internals, static assets and files with an extension.
  matcher: ["/((?!admin|api|_next|_vercel|images|.*\\..*).*)"],
};
