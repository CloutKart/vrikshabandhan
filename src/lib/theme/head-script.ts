import { DEFAULT_THEME, HERO_SESSION_KEY, THEME_COLORS, THEME_STORAGE_KEY } from "./constants";

/**
 * Runs before first paint: applies the stored theme, records whether the
 * visitor allows motion (initial hidden states exist only under
 * html[data-motion="full"]) and marks the hero as pending unless it already
 * played this session.
 */
export const THEME_HEAD_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark"){d.dataset.theme=t}}catch(e){}var c=${JSON.stringify(THEME_COLORS)}[d.dataset.theme||${JSON.stringify(DEFAULT_THEME)}];var m=document.querySelector('meta[name="theme-color"]');if(m&&c){m.setAttribute("content",c)}d.dataset.js="";var r=false;try{r=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}d.dataset.motion=r?"reduced":"full";if(!r){var p=false;try{p=!!sessionStorage.getItem(${JSON.stringify(HERO_SESSION_KEY)})}catch(e){}if(!p){d.dataset.hero="pending"}}})();`;
