"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_COLORS, THEME_STORAGE_KEY, type Theme } from "@/lib/theme/constants";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** The <html data-theme> attribute is the single source of truth; the head script sets it before paint. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage may be unavailable; the choice then lasts for this page only */
  }
}

/** Pressed means the light theme is on. */
export function ThemeToggle() {
  const t = useTranslations("nav");
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-pressed={theme === "light"}
      aria-label={next === "light" ? t("themeToLight") : t("themeToDark")}
      onClick={() => applyTheme(next)}
      className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-150 ease-enter hover:bg-ground-2 active:scale-[var(--scale-press)]"
    >
      <span className="grid h-5 w-5 place-items-center">
        <svg data-glyph="sun" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10" cy="10" r="4.5" />
          <path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2 16 16M4 16l1.8-1.8M14.2 5.8 16 4" />
        </svg>
        <svg data-glyph="moon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16.5 12.3A7 7 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8Z" />
        </svg>
      </span>
    </button>
  );
}
