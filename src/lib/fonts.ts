import { Mukta, Tiro_Devanagari_Hindi } from "next/font/google";

/** One serif for both scripts: regular and italic only, so hierarchy comes from size. */
export const tiro = Tiro_Devanagari_Hindi({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "devanagari"],
  variable: "--font-tiro",
  display: "swap",
});

/** Navigation, labels, dates, forms. */
export const mukta = Mukta({
  weight: ["400", "500"],
  subsets: ["latin", "devanagari"],
  variable: "--font-mukta",
  display: "swap",
});
