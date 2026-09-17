/**
 * The site's motion, mounted once per route by MotionRoot. Everything here is
 * driven by data attributes the server markup already carries, so components
 * stay server-rendered and this chunk loads after the page is interactive.
 *
 * The head script sets html[data-motion="full"] only when the visitor has not
 * asked for reduced motion; without it the CSS never hides anything and this
 * module only marks reveals (harmless) and does nothing else.
 */
import { HERO_SESSION_KEY } from "@/lib/theme/constants";
import { getGsap } from "./gsap";
import { dur, ease, move, stagger } from "./tokens";

type Cleanup = () => void;
const noop: Cleanup = () => {};

/**
 * While a heading's text is split into animated pieces, the pieces are hidden
 * from assistive tech and the heading itself carries its full text as an
 * accessible name (aria-label is permitted on headings, not on plain spans).
 */
function nameHeading(el: Element): () => void {
  const heading = el.closest("h1, h2, h3");
  if (!heading) return noop;
  heading.setAttribute("aria-label", (heading.textContent ?? "").replace(/\s+/g, " ").trim());
  return () => heading.removeAttribute("aria-label");
}

export function mount(pathname: string): Cleanup {
  const html = document.documentElement;
  const full = html.dataset.motion === "full";
  const cleanups: Cleanup[] = [revealObserver(), headerRule()];
  if (full) cleanups.push(heroSequence(), titleReveal(), flipMorph(pathname));
  // Lets tests (and anything else) know the listeners exist for this route.
  html.dataset.motionReady = "";
  return () => {
    delete html.dataset.motionReady;
    cleanups.forEach((c) => c());
  };
}

/* Reveals: mark elements once they enter the viewport; CSS does the rest. */
/** The header ties its thread as the page scrolls: --progress is the share of the page read, data-scrolled marks any scroll. */
function headerRule(): Cleanup {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header) return noop;
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    header.style.setProperty("--progress", progress.toFixed(4));
    if (window.scrollY > 8) header.dataset.scrolled = "";
    else delete header.dataset.scrolled;
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (raf) cancelAnimationFrame(raf);
    header.style.removeProperty("--progress");
    delete header.dataset.scrolled;
  };
}

function revealObserver(): Cleanup {
  const targets = document.querySelectorAll("[data-reveal]:not([data-revealed])");
  if (!targets.length) return noop;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.setAttribute("data-revealed", "");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((t) => io.observe(t));
  return () => io.disconnect();
}

/* The one orchestrated moment: the headline rises under the leaves, the leaves fade in. Once per session. */
function heroSequence(): Cleanup {
  const html = document.documentElement;
  if (html.dataset.hero !== "pending") return noop;
  const title = document.querySelector<HTMLElement>("[data-hero-title]");
  const finishOnly = () => {
    delete html.dataset.hero;
  };
  if (!title) {
    finishOnly();
    return noop;
  }
  const primary = title.querySelector<HTMLElement>(":scope > span:first-child");
  const secondary = title.querySelector<HTMLElement>(":scope > span:nth-child(2)");
  const cutout = document.querySelectorAll<HTMLElement>(".hero-cutout");

  let done = false;
  let split: { revert: () => void } | undefined;
  let tl: { kill: () => void } | undefined;
  let unname: () => void = noop;
  const finish = () => {
    if (done) return;
    done = true;
    split?.revert();
    unname();
    try {
      sessionStorage.setItem(HERO_SESSION_KEY, "1");
    } catch {
      /* private mode: the sequence simply plays again next time */
    }
    delete html.dataset.hero;
  };
  const safety = window.setTimeout(finish, 1600);

  document.fonts.ready.then(() => {
    if (done || !primary) return finish();
    const { gsap, SplitText } = getGsap();
    const hindi = html.lang === "hi";
    unname = nameHeading(primary);
    // Words first so lines only break between words while the characters rise.
    const s = SplitText.create(primary, { type: hindi ? "words" : "words,chars", aria: "hidden" });
    split = s;
    const pieces = hindi ? s.words : s.chars;
    gsap.set(title, { perspective: 600 });
    const timeline = gsap.timeline({ onComplete: finish, defaults: { ease: ease.out } });
    tl = timeline;
    timeline.set(title, { opacity: 1 }, 0);
    timeline.from(
      pieces,
      { y: move.char, rotateX: -40, opacity: 0, duration: 0.6, stagger: hindi ? stagger.word : stagger.char, ease: ease.expo },
      "<",
    );
    if (secondary) timeline.from(secondary, { y: move.reveal, opacity: 0, duration: 0.4 }, "-=0.35");
    if (cutout.length) timeline.to(cutout, { opacity: 1, duration: 0.6, ease: ease.soft }, "<-0.2");
  });

  return () => {
    window.clearTimeout(safety);
    tl?.kill();
    finish();
  };
}

/* Page titles arrive as words: a lighter cousin of the hero moment, once per page load. */
function titleReveal(): Cleanup {
  const targets = document.querySelectorAll<HTMLElement>("[data-title-reveal]:not([data-title-done])");
  if (!targets.length) return noop;
  const reverts: Array<() => void> = [];
  let cancelled = false;
  const timers: number[] = [];

  document.fonts.ready.then(() => {
    if (cancelled) return;
    const { gsap, SplitText } = getGsap();
    targets.forEach((el) => {
      const unname = nameHeading(el);
      const s = SplitText.create(el, { type: "words", aria: "hidden" });
      let reverted = false;
      const revert = () => {
        if (reverted) return;
        reverted = true;
        s.revert();
        unname();
      };
      reverts.push(revert);
      const tween = gsap.from(s.words, {
        y: move.word,
        opacity: 0,
        duration: dur.reveal,
        stagger: stagger.word,
        ease: ease.out,
        onComplete: revert,
      });
      el.setAttribute("data-title-done", "");
      timers.push(window.setTimeout(() => {
        tween.kill();
        revert();
      }, 1400));
    });
  });

  return () => {
    cancelled = true;
    timers.forEach((t) => window.clearTimeout(t));
    reverts.forEach((r) => r());
    targets.forEach((el) => el.setAttribute("data-title-done", ""));
  };
}


/* A story cover morphs from its row into the story page. Falls back to the page fade when there is no captured state. */
type FlipState = { id: string; state: unknown; at: number };
let captured: FlipState | null = null;

function flipMorph(pathname: string): Cleanup {
  const { Flip } = getGsap();

  const target = document.querySelector<HTMLElement>("[data-paper] [data-flip-id]");
  if (target && captured && captured.id === target.dataset.flipId && Date.now() - captured.at < 3000) {
    Flip.from(captured.state as Parameters<typeof Flip.from>[0], { targets: target, duration: dur.reveal, ease: ease.out, scale: true, absolute: true });
  }
  captured = null;

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const row = rowOf(e.target);
    const el = row?.querySelector<HTMLElement>("[data-flip-id]");
    if (!el || !el.dataset.flipId) return;
    captured = { id: el.dataset.flipId, state: Flip.getState(el), at: Date.now() };
  };
  const rowOf = (t: EventTarget | null) => (t instanceof Element ? t.closest("[data-story-row]") : null);
  document.addEventListener("click", onClick);
  void pathname;
  return () => document.removeEventListener("click", onClick);
}
