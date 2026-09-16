import { programmeNumbers } from "@/lib/content/numbers";

/** Impact numbers, shown only once the Abhiyan has counted them. Renders nothing until then. */
export function NumbersBlock({ title, labels }: { title: string; labels: Record<keyof NonNullable<typeof programmeNumbers>, string> }) {
  const n = programmeNumbers;
  if (!n) return null;
  const rows: Array<[string, number]> = [
    [labels.treesPlanted, n.treesPlanted],
    [labels.treesAlive, n.treesAlive],
    [labels.schools, n.schools],
    [labels.villages, n.villages],
    [labels.volunteers, n.volunteers],
  ];
  return (
    <section data-numbers aria-label={title} className="mt-16">
      <h2 className="text-[2rem] leading-tight">{title}</h2>
      <dl className="mt-6 grid gap-6 min-[820px]:grid-cols-5">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dd className="text-[2.5rem] text-gold">{value.toLocaleString("en-IN")}</dd>
            <dt className="font-sans text-sm text-ink-2">{label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 font-sans text-sm text-ink-2">{n.asOf}</p>
    </section>
  );
}
