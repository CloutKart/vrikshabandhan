type Entry = { year: string; place: string; title: string; text: string };

/** The movements this one stands in, as a description list: year and name, then place and what happened. */
export function Lineage({ entries }: { entries: Entry[] }) {
  return (
    <dl data-lineage className="mt-8 grid gap-10 min-[820px]:grid-cols-2">
      {entries.map((e) => (
        <div key={e.year} className="border-t border-moss pt-5">
          <dt className="text-[1.6rem] leading-tight">
            <time dateTime={e.year} className="mr-3 font-sans text-base text-gold">
              {e.year}
            </time>
            {e.title}
          </dt>
          <dd className="mt-1 font-sans text-sm text-ink-2">{e.place}</dd>
          <dd className="mt-3 max-w-[48ch]">{e.text}</dd>
        </div>
      ))}
    </dl>
  );
}
