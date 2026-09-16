import type { CSSProperties } from "react";

type Item = { year: string; text: string };

/** Thirty years as an ordered list; the year is a real <time>. Entries rise in one stagger when the list comes into view. */
export function Timeline({ items }: { items: Item[] }) {
  return (
    <ol data-timeline className="mt-8 space-y-6 border-l-2 border-sutra pl-6">
      {items.map((item, i) => (
        <li
          key={item.year}
          data-reveal="rise"
          style={{ "--i": i } as CSSProperties}
          className="grid gap-1 min-[820px]:grid-cols-[6rem_1fr] min-[820px]:gap-6"
        >
          <time dateTime={item.year} className="font-sans text-gold">
            {item.year}
          </time>
          <p className="max-w-[60ch]">{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
