"use client";

import { useRef, useState, type ReactNode } from "react";

type Props = { children: ReactNode; labels: { menu: string; close: string } };

/**
 * Phone navigation as a native dialog: showModal() gives the focus trap,
 * Escape handling and focus restoration for free. Closes itself when a
 * link inside it is followed.
 */
export function MobileNav({ children, labels }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={labels.menu}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }}
        className="grid h-11 w-11 place-items-center min-[820px]:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 6h16M3 11h16M3 16h16" />
        </svg>
      </button>
      <dialog
        id="mobile-nav"
        ref={ref}
        className="sheet"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) ref.current?.close();
        }}
      >
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="min-h-11 px-3 font-sans text-ink-2 hover:text-ink"
          >
            {labels.close}
          </button>
        </div>
        <nav className="mt-8">{children}</nav>
      </dialog>
    </>
  );
}
