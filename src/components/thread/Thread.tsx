/**
 * The raksha sutra as a rakhi: a braided red-and-gold thread down the left
 * edge, with a medallion, tassels and three leaves that ride the scroll and
 * slide to the story row under the pointer (see lib/motion/site). The braid
 * draws itself on first visit. Decorative for assistive tech, load-bearing
 * for the layout: the page gutter follows it.
 */
export function Thread() {
  return (
    <div
      data-thread
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-[calc(var(--thread-x)-3px)] z-30 hidden w-[6px] min-[820px]:block"
    >
      <svg className="h-full w-[6px] overflow-visible" width="6" height="100%">
        <defs>
          <pattern id="rakhi-braid" patternUnits="userSpaceOnUse" width="6" height="14">
            <path d="M1 0 C5.5 3.5 5.5 10.5 1 14" stroke="var(--sutra)" strokeWidth="2.2" fill="none" />
            <path d="M5 0 C0.5 3.5 0.5 10.5 5 14" stroke="var(--gold)" strokeWidth="2.2" fill="none" />
          </pattern>
        </defs>
        <line x1="3" y1="0" x2="3" y2="100%" pathLength={1} stroke="url(#rakhi-braid)" strokeWidth="6" />
      </svg>
      <span data-knot className="absolute left-1/2 top-[120px] block h-[72px] w-[72px] -translate-x-1/2 -translate-y-[30px]">
        <svg data-knot-dot className="block" width="72" height="72" viewBox="0 0 72 72">
          <g className="rakhi-leaves">
            <path className="leaf" d="M36 30 C48 16 62 18 64 28 C56 38 42 38 36 30 Z" fill="var(--leaf-green)" />
            <path className="leaf" d="M36 32 C52 34 58 46 54 56 C42 52 36 44 36 32 Z" fill="var(--leaf-blue)" />
            <path className="leaf" d="M36 30 C24 16 10 18 8 28 C16 38 30 38 36 30 Z" fill="var(--leaf-gold)" />
            <path d="M36 30 L60 27 M36 32 L52 52 M36 30 L12 27" stroke="var(--ground)" strokeWidth="0.8" fill="none" opacity="0.6" />
          </g>
          <path d="M32 40 C30 48 27 56 24 66 M40 40 C42 48 45 56 48 66" stroke="var(--sutra)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="30" r="12" fill="var(--gold)" />
          <circle cx="36" cy="30" r="8" fill="var(--sutra)" />
          <circle cx="36" cy="30" r="3" fill="var(--paper)" />
          <g fill="var(--paper)">
            <circle cx="36" cy="19.5" r="1.3" />
            <circle cx="46.5" cy="30" r="1.3" />
            <circle cx="36" cy="40.5" r="1.3" />
            <circle cx="25.5" cy="30" r="1.3" />
            <circle cx="43.4" cy="22.6" r="1.1" />
            <circle cx="43.4" cy="37.4" r="1.1" />
            <circle cx="28.6" cy="37.4" r="1.1" />
            <circle cx="28.6" cy="22.6" r="1.1" />
          </g>
        </svg>
      </span>
    </div>
  );
}
