export const THEME_STORAGE_KEY = "va-theme";
export const HERO_SESSION_KEY = "va-hero";
export type Theme = "dark" | "light";
export const DEFAULT_THEME: Theme = "dark";
export const THEME_COLORS: Record<Theme, string> = { dark: "#12211A", light: "#E4EAE1" };
