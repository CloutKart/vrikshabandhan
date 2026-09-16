import { notFound } from "next/navigation";

/** Any unknown path under a locale renders the locale's not-found page. */
export default function CatchAll() {
  notFound();
}
