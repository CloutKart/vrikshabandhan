type Entry = { year: string; place: string; title: string; text: string };

/** The movements this one stands in, as a vertical timeline with the years at display size. */
export function Lineage({ entries }: { entries: Entry[] }) {
  return (
    <ol data-lineage className="mt-10 border-l-2 border-sutra">
      {entries.map((e) => (
        <li key={e.year} className="grid gap-2 py-8 pl-8 min-[820px]:grid-cols-[10rem_1fr] min-[820px]:gap-10">
          <time dateTime={e.year} className="numeral-xl">
            {e.year}
          </time>
          <div>
            <p className="text-[1.75rem] leading-tight">{e.title}</p>
            <p className="mt-1 font-sans text-sm text-ink-2">{e.place}</p>
            <p className="mt-3 max-w-[52ch]">{e.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
