/**
 * The raksha sutra: a fixed red line down the left edge with a knot.
 * Static here; the draw-on and the scroll-following knot arrive with the motion layer.
 * Decorative for assistive tech, but load-bearing for the layout (the page gutter follows it).
 */
export function Thread() {
  return (
    <div
      data-thread
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-[var(--thread-x)] z-30 hidden w-[2px] bg-sutra min-[820px]:block"
    >
      <span
        data-knot
        className="absolute left-1/2 top-[120px] h-3 w-3 -translate-x-1/2 rounded-full bg-sutra shadow-[0_0_0_3px_var(--ground)]"
      />
    </div>
  );
}
