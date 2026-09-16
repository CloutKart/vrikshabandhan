import type { CSSProperties } from "react";

type Item = { year: string; text: string };

/** Thirty years as an ordered list; the year is a real <time> at numeral size. Entries rise in one stagger. */
export function Timeline({ items }: { items: Item[] }) {
  return (
    <ol data-timeline className="mt-10 border-l-2 border-sutra">
      {items.map((item, i) => (
        <li
          key={item.year}
          data-reveal="rise"
          style={{ "--i": i } as CSSProperties}
          className="grid gap-2 py-7 pl-8 min-[820px]:grid-cols-[10rem_1fr] min-[820px]:gap-10 min-[820px]:items-start"
        >
          <time dateTime={item.year} className="numeral-xl">
            {item.year}
          </time>
          <p className="max-w-[56ch] text-lg leading-relaxed min-[820px]:pt-2">{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
