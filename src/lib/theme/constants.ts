export const THEME_STORAGE_KEY = "va-theme";
export const HERO_SESSION_KEY = "va-hero";
/** localStorage: "seen" once the subscribe invitation has shown, "subscribed" once someone confirmed from this browser. */
export const NEWSLETTER_STORAGE_KEY = "va-newsletter";
export type Theme = "dark" | "light";
export const DEFAULT_THEME: Theme = "light";
export const THEME_COLORS: Record<Theme, string> = { dark: "#0C1710", light: "#E4EAE1" };
