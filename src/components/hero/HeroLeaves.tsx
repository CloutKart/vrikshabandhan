import type { CSSProperties } from "react";

/**
 * Nine leaves let go of the canopy and drift down across the headline, on a loop.
 * Each leaf is a pointed oval in one of the painting's leaf colours with the same dark edge and midrib.
 * Position and timing come from custom properties; hero.css does the falling. Decorative, so hidden
 * from assistive tech, and not rendered at all under reduced motion or on phones.
 */
type Leaf = { x: number; y: number; size: number; colour: "green" | "blue" | "gold"; duration: number; delay: number; drift: number; spin: number; flip?: boolean };

const LEAVES: Leaf[] = [
  { x: 9, y: 31, size: 30, colour: "green", duration: 8.5, delay: 0, drift: 34, spin: 250 },
  { x: 16, y: 36, size: 24, colour: "gold", duration: 10, delay: 2.2, drift: -28, spin: -200, flip: true },
  { x: 27, y: 33, size: 32, colour: "blue", duration: 9, delay: 4.6, drift: 40, spin: 300 },
  { x: 38, y: 40, size: 22, colour: "green", duration: 7.5, delay: 1.4, drift: -22, spin: -160 },
  { x: 48, y: 42, size: 28, colour: "gold", duration: 11, delay: 6.1, drift: 30, spin: 220, flip: true },
  { x: 57, y: 44, size: 26, colour: "green", duration: 8, delay: 3.3, drift: -36, spin: -280 },
  { x: 66, y: 45, size: 30, colour: "blue", duration: 9.5, delay: 7.4, drift: 24, spin: 190 },
  { x: 76, y: 39, size: 23, colour: "gold", duration: 8.8, delay: 5.2, drift: -30, spin: -240, flip: true },
  { x: 86, y: 34, size: 27, colour: "green", duration: 10.5, delay: 0.9, drift: 26, spin: 210 },
];

export function HeroLeaves() {
  return (
    <div className="hero-leaves" aria-hidden="true" data-hero-leaves>
      {LEAVES.map((l, i) => (
        <svg
          key={i}
          className="hero-leaf"
          viewBox="0 0 32 18"
          style={
            {
              "--x": `${l.x}cqw`,
              "--y": `${l.y}cqw`,
              "--size": `${l.size}px`,
              "--duration": `${l.duration}s`,
              "--delay": `${l.delay}s`,
              "--drift": `${l.drift}px`,
              "--spin": `${l.spin}deg`,
              "--flip": l.flip ? -1 : 1,
            } as CSSProperties
          }
        >
          <path d="M1.5 9C6 2.5 14 1 30.5 3.2 26.5 13.5 14 17.8 1.5 9Z" fill={`var(--leaf-${l.colour})`} stroke="var(--paper-ink)" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M3 9.2C11 8.6 19 7.3 28.5 3.8" fill="none" stroke="var(--paper-ink)" strokeWidth="0.7" opacity="0.7" />
        </svg>
      ))}
    </div>
  );
}
