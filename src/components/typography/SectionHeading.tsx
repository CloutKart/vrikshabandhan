import type { ReactNode } from "react";
import type { Pair } from "@/lib/i18n/bilingual";
import { BilingualHeading } from "./BilingualHeading";

/** A chapter heading in both scripts with the thread rule above it and an optional action on the right. */
export function SectionHeading({ pair, action, id }: { pair: Pair; action?: ReactNode; id?: string }) {
  return (
    <div>
      <hr className="thread-rule" />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <BilingualHeading
          as="h2"
          {...pair}
          className="text-[clamp(2rem,3vw,2.75rem)] leading-tight"
          secondaryClassName="text-ink-2"
          riseSecondary
        />
        {action}
      </div>
      {id ? <span id={id} /> : null}
    </div>
  );
}
