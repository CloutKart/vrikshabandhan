/**
 * The mail's colours: the light theme of src/styles/tokens.css, copied here as
 * literals because mail clients cannot read CSS variables. The light theme,
 * not the dark one, because dark gold on paper is unreadable while these pairs
 * all pass. tests/unit/newsletter.palette.test.ts keeps every value equal to
 * the token file and checks the contrast.
 */
export const PALETTE = {
  ground: "#E4EAE1",
  paper: "#F7F4EA",
  paperInk: "#10231A",
  paperInk2: "#3E4F45",
  sutra: "#B4231D",
  gold: "#7A5A0E",
  moss: "#6F7F74",
  leafGreen: "#4C8A32",
  leafBlue: "#2F4F8F",
  leafGold: "#C7961F",
} as const;

/** Token name for each palette entry, for the test that ties them together. */
export const PALETTE_TOKENS: Record<keyof typeof PALETTE, string> = {
  ground: "ground",
  paper: "paper",
  paperInk: "paper-ink",
  paperInk2: "paper-ink-2",
  sutra: "sutra",
  gold: "gold",
  moss: "moss",
  leafGreen: "leaf-green",
  leafBlue: "leaf-blue",
  leafGold: "leaf-gold",
};
