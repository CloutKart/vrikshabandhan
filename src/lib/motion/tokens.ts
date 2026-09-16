/** Mirrors the motion tokens in src/styles/tokens.css, in seconds for GSAP. */
export const dur = { press: 0.1, hover: 0.15, state: 0.2, enter: 0.3, reveal: 0.5, orchestrated: 0.9 } as const;
export const ease = { out: "power2.out", inOut: "power2.inOut", expo: "expo.out", soft: "power1.out", none: "none" } as const;
export const stagger = { char: 0.015, word: 0.03, list: 0.03, grid: 0.06, section: 0.08 } as const;
export const move = { lift: 4, reveal: 12, revealLg: 24, char: 20, word: 16 } as const;
