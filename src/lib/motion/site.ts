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
  const cleanups: Cleanup[] = [revealObserver()];
  if (full) cleanups.push(heroSequence(), titleReveal(), knot(), flipMorph(pathname));
  return () => cleanups.forEach((c) => c());
}

/* Reveals: mark elements once they enter the viewport; CSS does the rest. */
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

/* The one orchestrated moment: thread draws, headline rises under the leaves, leaves fade in. Once per session. */
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
  const cutout = document.querySelector<HTMLElement>(".hero-cutout");
  const line = document.querySelector<SVGLineElement>("[data-thread] line");

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
    if (line) timeline.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur.orchestrated, ease: ease.inOut });
    timeline.set(title, { opacity: 1 }, line ? "-=0.45" : 0);
    timeline.from(
      pieces,
      { y: move.char, rotateX: -40, opacity: 0, duration: 0.6, stagger: hindi ? stagger.word : stagger.char, ease: ease.expo },
      "<",
    );
    if (secondary) timeline.from(secondary, { y: move.reveal, opacity: 0, duration: 0.4 }, "-=0.35");
    if (cutout) timeline.to(cutout, { opacity: 1, duration: 0.6, ease: ease.soft }, "<-0.2");
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

/* The knot rides the thread with the scroll, and slides to the story row under the pointer or focus. */
function knot(): Cleanup {
  const knotEl = document.querySelector<HTMLElement>("[data-knot]");
  const dot = knotEl?.querySelector<HTMLElement>("[data-knot-dot]");
  if (!knotEl || !dot) return noop;
  const { gsap, ScrollTrigger } = getGsap();

  const ride = gsap.to(knotEl, {
    y: () => Math.max(0, window.innerHeight - 240),
    ease: ease.none,
    scrollTrigger: { start: 0, end: "max", scrub: 0.6, invalidateOnRefresh: true },
  });
  ScrollTrigger.refresh();

  let current: Element | null = null;
  const follow = (row: Element | null) => {
    if (row === current) return;
    current = row;
    if (!row) {
      gsap.to(dot, { y: 0, duration: 0.35, ease: ease.out, overwrite: true });
      return;
    }
    const rowTop = row.getBoundingClientRect().top;
    const k = knotEl.getBoundingClientRect();
    const delta = rowTop + 30 - (k.top + k.height / 2);
    gsap.to(dot, { y: delta, duration: 0.35, ease: ease.out, overwrite: true });
  };
  const rowOf = (t: EventTarget | null) => (t instanceof Element ? t.closest("[data-story-row]") : null);
  const onOver = (e: Event) => follow(rowOf(e.target));
  const onFocus = (e: Event) => follow(rowOf(e.target));
  const onBlur = (e: FocusEvent) => {
    if (!rowOf(e.relatedTarget)) follow(null);
  };
  document.addEventListener("pointerover", onOver);
  document.addEventListener("focusin", onFocus);
  document.addEventListener("focusout", onBlur);

  return () => {
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("focusin", onFocus);
    document.removeEventListener("focusout", onBlur);
    ride.scrollTrigger?.kill();
    ride.kill();
    gsap.set(dot, { clearProps: "transform" });
    gsap.set(knotEl, { clearProps: "transform" });
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
