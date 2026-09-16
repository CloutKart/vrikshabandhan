import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * A chapter's cross-reference ("All stories", "Why a thread, why a tree").
 * Serif at text size with the thread underline, so it reads as part of the
 * editorial voice rather than as a caption.
 */
export function SectionAction({ href, children, className = "" }: { href: ComponentProps<typeof Link>["href"]; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex min-h-11 items-center text-xl leading-tight ${className}`}>
      <span className="u-thread">{children}</span>
    </Link>
  );
}
