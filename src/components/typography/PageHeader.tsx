import { BilingualHeading } from "./BilingualHeading";
import type { Pair } from "@/lib/i18n/bilingual";

/** Page title in both languages plus an optional one-line lede. */
export function PageHeader({ pair, lede }: { pair: Pair; lede?: string }) {
  return (
    <header className="page pt-16 pb-12 min-[820px]:pt-24 min-[820px]:pb-16">
      <BilingualHeading
        as="h1"
        {...pair}
        className="max-w-[18ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.02em]"
        secondaryClassName="mt-3 text-ink-2"
      />
      {lede ? <p className="mt-8 max-w-[52ch] text-xl leading-relaxed text-ink-2">{lede}</p> : null}
    </header>
  );
}
