import type { ReactNode } from "react";

/** The reading surface: a sheet of paper laid on the ground, in both themes. */
export function PaperSheet({ children }: { children: ReactNode }) {
  return (
    <article data-paper className="paper mx-auto w-full max-w-[calc(65ch+2*clamp(1.25rem,5vw,4rem))]">
      {children}
    </article>
  );
}
