import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";

const items = [
  { key: "stories", href: "/stories" },
  { key: "thread", href: "/thread" },
  { key: "founder", href: "/founder" },
  { key: "involve", href: "/get-involved" },
  { key: "contact", href: "/get-involved#contact" },
] as const;

/** The site's primary navigation, rendered once in the header and once inside the phone menu. */
export function NavLinks({ orientation }: { orientation: "row" | "column" }) {
  const t = useTranslations("nav");
  return (
    <ul className={orientation === "row" ? "flex items-center gap-4 min-[1200px]:gap-7" : "flex flex-col gap-5 text-2xl"}>
      {items.map((item) => (
        <li key={item.key}>
          <Link href={item.href} className="inline-flex min-h-11 items-center font-sans">
            <span className="u-thread">{t(item.key)}</span>
          </Link>
        </li>
      ))}
      {/* The editor lives outside the locale routes, so this is a plain link with no language prefix. */}
      <li>
        <NextLink href="/admin" className="inline-flex min-h-11 items-center font-sans">
          <span className="u-thread">{t("admin")}</span>
        </NextLink>
      </li>
    </ul>
  );
}
