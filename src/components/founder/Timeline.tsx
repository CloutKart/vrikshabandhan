import type { CSSProperties } from "react";

type Item = { year: string; text: string };

/** Thirty years as an ordered list; the year is a real <time> at display size. Entries rise in one stagger. */
export function Timeline({ items }: { items: Item[] }) {
  return (
    <ol data-timeline className="mt-8 border-l-2 border-sutra">
      {items.map((item, i) => (
        <li
          key={item.year}
          data-reveal="rise"
          style={{ "--i": i } as CSSProperties}
          className="grid gap-2 py-6 pl-8 min-[820px]:grid-cols-[8rem_1fr] min-[820px]:gap-8"
        >
          <time dateTime={item.year} className="font-serif text-[2.25rem] leading-none text-gold">
            {item.year}
          </time>
          <p className="max-w-[56ch]">{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
