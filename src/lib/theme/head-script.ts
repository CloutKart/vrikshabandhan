import { DEFAULT_THEME, HERO_SESSION_KEY, THEME_COLORS, THEME_STORAGE_KEY } from "./constants";

/**
 * Runs before first paint: applies the stored theme, marks that JS is running
 * (reveal styles only hide things under html[data-js]) and marks the hero as
 * pending unless it already played this session or motion is reduced.
 */
export const THEME_HEAD_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark"){d.dataset.theme=t}}catch(e){}var c=${JSON.stringify(THEME_COLORS)}[d.dataset.theme||${JSON.stringify(DEFAULT_THEME)}];var m=document.querySelector('meta[name="theme-color"]');if(m&&c){m.setAttribute("content",c)}d.dataset.js="";try{var r=matchMedia("(prefers-reduced-motion: reduce)").matches;if(!r&&!sessionStorage.getItem(${JSON.stringify(HERO_SESSION_KEY)})){d.dataset.hero="pending"}}catch(e){}})();`;
