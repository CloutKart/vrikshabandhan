import type { CSSProperties } from "react";

/**
 * Nine leaves let go of the canopy and are carried down and to the right, as if
 * on a breeze, across the headline. Each has its own shape (drawn in the painting's
 * leaf colours with the same dark edge and midrib), size, timing, drift and spin,
 * They start inside the
 * canopy, behind the cut-out, so they appear to come out of the tree rather than
 * out of the air. Decorative: hidden from assistive tech, and not rendered at all
 * under reduced motion or on phones. hero.css does the falling.
 */
type Shape = "ovate" | "narrow" | "broad" | "heart" | "toothed";
type Leaf = { x: number; y: number; size: number; colour: "green" | "blue" | "gold"; shape: Shape; duration: number; delay: number; drift: number; spin: number; flip?: boolean };

/** Leaf outlines and midribs in a 32x18 box, tip to the right. */
const SHAPES: Record<Shape, { outline: string; rib: string }> = {
  ovate: { outline: "M1.5 9C6 2.5 14 1 30.5 3.2 26.5 13.5 14 17.8 1.5 9Z", rib: "M3 9.2C11 8.6 19 7.3 28.5 3.8" },
  narrow: { outline: "M1 9.5C8 5.5 18 3 31 1.5 24 10 14 15.5 1 9.5Z", rib: "M3 9.3C12 7.5 20 5 29 2.2" },
  broad: { outline: "M1.5 9C4 2 13 -0.5 22 1.5 29 3 31 8 30 10 26 16 14 19 4 14 2 12.5 1.5 10.5 1.5 9Z", rib: "M3 9.5C12 9 20 7.5 29 5" },
  heart: { outline: "M2 7C4 2 10 0.5 15 3 19 0.5 26 1 31 6 27 12 18 17.5 9 15 4 13.5 2 10 2 7Z", rib: "M3.5 8C12 8.5 20 7.5 29.5 6.5" },
  toothed: { outline: "M1.5 9 5 6.5 6 3 10 4.5 13 1.5 16 4 21 1.5 23 4.5 28 3 27.5 6.5 31 8.5 27 11 26 15 21 13.5 17 17 14 14 9 16.5 8 13 4 13 3.5 10.5Z", rib: "M3 9.2C11 9 19 8.5 29 8.3" },
};

const LEAVES: Leaf[] = [
  { x: 7, y: 26, size: 30, colour: "green", shape: "ovate", duration: 8.5, delay: 0, drift: 26, spin: 250 },
  { x: 15, y: 30, size: 24, colour: "gold", shape: "narrow", duration: 10, delay: 2.2, drift: 18, spin: 210, flip: true },
  { x: 25, y: 27, size: 32, colour: "blue", shape: "broad", duration: 9, delay: 4.6, drift: 30, spin: 300 },
  { x: 36, y: 33, size: 22, colour: "green", shape: "heart", duration: 7.5, delay: 1.4, drift: 22, spin: 180 },
  { x: 45, y: 35, size: 28, colour: "gold", shape: "toothed", duration: 11, delay: 6.1, drift: 34, spin: 240, flip: true },
  { x: 54, y: 37, size: 26, colour: "green", shape: "narrow", duration: 8, delay: 3.3, drift: 20, spin: 270 },
  { x: 63, y: 38, size: 30, colour: "blue", shape: "ovate", duration: 9.5, delay: 7.4, drift: 28, spin: 200 },
  { x: 73, y: 31, size: 23, colour: "gold", shape: "heart", duration: 8.8, delay: 5.2, drift: 16, spin: 230, flip: true },
  { x: 81, y: 27, size: 27, colour: "green", shape: "broad", duration: 10.5, delay: 0.9, drift: 24, spin: 190 },
];

export function HeroLeaves() {
  return (
    <div className="hero-leaves" aria-hidden="true" data-hero-leaves>
      {LEAVES.map((l, i) => {
        const shape = SHAPES[l.shape];
        return (
          <svg
            key={i}
            className="hero-leaf"
            data-shape={l.shape}
            viewBox="-16 -9 32 18"
            style={
              {
                "--x": `${l.x}cqw`,
                "--y": `${l.y}cqw`,
                "--size": `${l.size}px`,
                "--duration": `${l.duration}s`,
                "--delay": `${l.delay}s`,
                "--drift": `${l.drift}cqw`,
                "--spin": `${l.spin}deg`,
                "--flip": l.flip ? -1 : 1,
              } as CSSProperties
            }
          >
            <g transform="translate(-16 -9)">
              <path d={shape.outline} fill={`var(--leaf-${l.colour})`} stroke="var(--paper-ink)" strokeWidth="1.1" strokeLinejoin="round" />
              <path d={shape.rib} fill="none" stroke="var(--paper-ink)" strokeWidth="0.7" opacity="0.7" />
            </g>
          </svg>
        );
      })}
    </div>
  );
}
