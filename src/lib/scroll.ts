import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

let lenis: Lenis | null = null;

export const getLenis = () => lenis;
export const hasSmoothScroll = () => lenis !== null;

/**
 * Boot smooth scrolling and wire it into the GSAP ticker + ScrollTrigger.
 * Returns a teardown function. Pass `enabled = false` for reduced-motion
 * users — native scrolling then takes over and everything stays usable.
 */
export function initSmoothScroll(enabled: boolean): () => void {
  if (!enabled || lenis) return () => {};

  lenis = new Lenis({
    duration: 1.15,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    smoothWheel: true,
    // Keep native scrolling on touch for reliability on mid-range phones.
    syncTouch: false,
  });

  const onScroll = () => ScrollTrigger.update();
  lenis.on("scroll", onScroll);

  const tick = (time: number) => {
    lenis?.raf(time * 1000);
  };

  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis?.off("scroll", onScroll);
    lenis?.destroy();
    lenis = null;
  };
}

/**
 * Force smooth scrolling back on. Safe to call repeatedly — used by the menu
 * and lightbox teardown so a scroll-lock can never be left behind, which
 * would make the whole page unscrollable.
 */
export function resumeSmoothScroll(): void {
  if (lenis) {
    lenis.start();
    return;
  }
  // Lenis absent (reduced motion) — clear any stale stop class from a
  // previous session so the document can always scroll.
  document.documentElement.classList.remove("lenis-stopped");
}

type ScrollTarget = string | number | HTMLElement;

function resolveEl(target: ScrollTarget): HTMLElement | null {
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  if (typeof target === "number") return null;
  return target;
}

/** Smooth-scroll to a selector, pixel offset or element. Falls back to native. */
export function scrollTo(target: ScrollTarget, offsetY = 0): void {
  const el = resolveEl(target);
  if (typeof target !== "number" && !el) return;

  if (lenis) {
    // Passing the resolved element (rather than a selector string) is more
    // reliable and avoids a silent no-op if the node isn't found in time.
    const opts = { offset: offsetY, duration: 1.3, easing: (t: number) => 1 - Math.pow(1 - t, 3) };
    if (el) lenis.scrollTo(el, opts);
    else if (typeof target === "number") lenis.scrollTo(target + offsetY, opts);
    return;
  }

  if (typeof target === "number") {
    window.scrollTo({ top: target + offsetY, behavior: "smooth" });
  } else if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY + offsetY;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

/** Scroll to an element id (without the leading '#'). */
export function scrollToId(id: string): void {
  scrollTo(`#${id}`);
}
