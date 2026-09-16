import { Mukta, Tiro_Devanagari_Hindi } from "next/font/google";

/**
 * One serif for both scripts. Hierarchy comes from size, so only the regular
 * weight is preloaded; the italic (quotes in letters) loads on demand.
 * Devanagari Tiro is preloaded because every page shows a Hindi heading line.
 */
export const tiro = Tiro_Devanagari_Hindi({
  weight: "400",
  style: "normal",
  subsets: ["latin", "devanagari"],
  variable: "--font-tiro",
  display: "swap",
});

export const tiroItalic = Tiro_Devanagari_Hindi({
  weight: "400",
  style: "italic",
  subsets: ["latin", "devanagari"],
  variable: "--font-tiro-italic",
  display: "swap",
  preload: false,
});

/** Navigation, labels, dates, forms. Latin is preloaded; the Devanagari file arrives when Hindi UI text renders. */
export const mukta = Mukta({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mukta",
  display: "swap",
});

export const muktaDevanagari = Mukta({
  weight: "400",
  subsets: ["devanagari"],
  variable: "--font-mukta-dev",
  display: "swap",
  preload: false,
});
