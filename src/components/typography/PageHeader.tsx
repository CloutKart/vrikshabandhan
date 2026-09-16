import type { ReactNode } from "react";
import { BilingualHeading } from "./BilingualHeading";
import type { Pair } from "@/lib/i18n/bilingual";

/**
 * Page title in both languages plus an optional one-line lede. With an aside,
 * the header becomes two columns on desktop: words left, the page's one image right.
 */
export function PageHeader({ pair, lede, aside }: { pair: Pair; lede?: string; aside?: ReactNode }) {
  const title = (
    <div>
      <BilingualHeading
        as="h1"
        {...pair}
        className="max-w-[18ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.02em]"
        secondaryClassName="mt-3 text-ink-2"
        reveal="title"
        riseSecondary
      />
      {lede ? <p className="mt-8 max-w-[52ch] text-xl leading-relaxed text-ink-2">{lede}</p> : null}
    </div>
  );
  if (!aside) return <header className="page pt-16 pb-12 min-[820px]:pt-24 min-[820px]:pb-16">{title}</header>;
  return (
    <header className="page pt-16 pb-12 min-[820px]:pt-20 min-[820px]:pb-14">
      <div className="grid gap-10 min-[1024px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-[1024px]:items-end min-[1024px]:gap-16">
        {title}
        {aside}
      </div>
    </header>
  );
}
