export const THEME_STORAGE_KEY = "va-theme";
export const HERO_SESSION_KEY = "va-hero";
export type Theme = "dark" | "light";
export const DEFAULT_THEME: Theme = "dark";
export const THEME_COLORS: Record<Theme, string> = { dark: "#0C1710", light: "#E4EAE1" };
