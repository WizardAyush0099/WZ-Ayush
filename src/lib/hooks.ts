import { useEffect, useState, type RefObject } from "react";
import { useStudio } from "./siteData";

/**
 * Turn a small mark as the page scrolls.
 *
 * The angle is accumulated from the scroll position rather than played on a
 * timer: scrolling down winds the mark one way, scrolling back up winds it the
 * other, and a small movement turns it a little instead of snapping. It never
 * stops — the angle wraps at 360°, so the loop is endless — and it is written
 * straight onto the element inside a rAF, so a long scroll costs no renders.
 *
 * A route change or an anchor jump moves the page thousands of pixels in one
 * event; `maxStep` clamps that so a jump reads as a turn, not a spin attack.
 * Reduced motion opts out entirely — and so does the dashboard: the mark's
 * speed (and an on/off switch) live in `#/admin → Studio → Motion`, so a caller
 * that passes no options still gets whatever the owner set.
 */
export function useScrollSpin(
  ref: RefObject<HTMLElement | null>,
  { degreesPerPixel, maxStep = 240 }: { degreesPerPixel?: number; maxStep?: number } = {},
): void {
  const reduced = usePrefersReducedMotion();
  const studio = useStudio();
  const on = studio.effects.scrollSpin;
  const degrees = degreesPerPixel ?? studio.motion.spinDegPerPx;

  useEffect(() => {
    const element = ref.current;
    if (!element || reduced || !degrees || !on) return;

    let angle = 0;
    let last: number | null = null;
    let raf = 0;

    const paint = () => {
      raf = 0;
      element.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    };

    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      if (last === null) last = y;
      const delta = Math.max(-maxStep, Math.min(maxStep, y - last));
      last = y;
      if (!delta) return;
      angle += delta * degrees;
      // Keep the number small forever; the mark only cares about the angle.
      angle %= 360;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ref, degrees, maxStep, reduced, on]);
}

/**
 * Spotlight — one listener for a whole grid, instead of one per card.
 *
 * Every element marked `data-spotlight` (they also carry the `spotlight`
 * class, which paints the glow) gets the pointer's position written into
 * `--spot-x` / `--spot-y`, and `--spot-o` is raised to 1 while the pointer is
 * over it. The work is a `closest()` lookup plus one `style.setProperty` per
 * frame — no React state, so moving a mouse across a nine-card grid costs nine
 * property writes and zero renders.
 *
 * Skipped entirely without a fine pointer (there is no hover to track on a
 * phone) and under reduced motion (the glow is decoration).
 */
export function useSpotlight(containerRef: RefObject<HTMLElement | null>): void {
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reduced || !fine) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    let active: HTMLElement | null = null;

    const paint = () => {
      raf = 0;
      const card = active;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${x - rect.left}px`);
      card.style.setProperty("--spot-y", `${y - rect.top}px`);
      card.style.setProperty("--spot-o", "1");
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>("[data-spotlight]") ?? null;
      if (card !== active) {
        active?.style.setProperty("--spot-o", "0");
        active = card;
      }
      if (!active) return;
      x = event.clientX;
      y = event.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      active?.style.setProperty("--spot-o", "0");
      active = null;
    };

    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      active?.style.setProperty("--spot-o", "0");
    };
  }, [containerRef, reduced, fine]);
}

/** Subscribe to a media query. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** True when the user asks for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on touch/coarse-pointer devices (no hover). */
export function useIsTouch(): boolean {
  return useMediaQuery("(hover: none), (pointer: coarse)");
}

/**
 * True when the viewport is taller than it is wide (phones, portrait tablets).
 *
 * A 16:9 frame cannot fill a portrait screen without being blown up past its
 * own resolution, so the hero gives it a band across the top instead and puts
 * the copy underneath — see `Hero`.
 */
export function useIsPortrait(): boolean {
  return useMediaQuery("(max-aspect-ratio: 5/4)");
}

/**
 * True when the visitor is on a phone-sized portrait screen.
 *
 * Width-based on purpose: the studio's Phone preview is a 390px iframe on a
 * desktop, and it has to show the phone hero for the owner to edit it. A wide
 * desktop window — and a phone held sideways — keep the desktop hero, which is
 * the framing that film was made for.
 */
export function useIsPhoneView(): boolean {
  return useMediaQuery("(max-width: 899px) and (max-aspect-ratio: 1/1)");
}

/** True when a precise pointer is available (desktop). */
export function useHasFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** Rough device capability tier used to scale particle counts / effects. */
export function useDeviceTier(): "low" | "mid" | "high" {
  const isTouch = useIsTouch();
  const [tier, setTier] = useState<"low" | "mid" | "high">("mid");

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    if (isTouch && (cores <= 4 || memory <= 3)) setTier("low");
    else if (isTouch) setTier("mid");
    else if (cores >= 8) setTier("high");
    else setTier("mid");
  }, [isTouch]);

  return tier;
}
