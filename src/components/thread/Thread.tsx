/**
 * The raksha sutra: a fixed red line down the left edge with a knot. The line
 * is an SVG path so it can draw itself on first visit; the knot rides the
 * scroll and slides to the story row under the pointer (see lib/motion/site).
 * Decorative for assistive tech, but load-bearing for the layout: the page
 * gutter follows it.
 */
export function Thread() {
  return (
    <div
      data-thread
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-[max(var(--thread-x),calc((100vw-1440px)/2+var(--thread-x)))] z-30 hidden w-[2px] min-[820px]:block"
    >
      <svg className="h-full w-[2px] overflow-visible" viewBox="0 0 2 100" preserveAspectRatio="none">
        <line x1="1" y1="0" x2="1" y2="100" pathLength={1} stroke="var(--sutra)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <span data-knot className="absolute left-1/2 top-[120px] h-3 w-3 -translate-x-1/2">
        <span data-knot-dot className="block h-3 w-3 rounded-full bg-sutra shadow-[0_0_0_3px_var(--ground)]" />
      </span>
    </div>
  );
}
