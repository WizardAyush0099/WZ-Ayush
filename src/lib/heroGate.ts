import { useSyncExternalStore } from "react";

/**
 * ============================================================================
 *  HERO GATE — when the navbar is allowed to appear
 * ============================================================================
 *  The opening film is full-bleed and the header used to float on top of it,
 *  clipping the top of the picture. The header is now held back until the run
 *  is effectively finished: the hero reports its progress here on every scroll
 *  frame, and the header slides down (over its own blurred backdrop) once the
 *  last frames are on screen. The desktop and phone heroes both report into
 *  this one store, so the rule is the same on either.
 *
 *  The store deliberately exposes only a boolean. Reporting raw progress would
 *  re-render the header on every frame of the run; the transition happens once.
 * ============================================================================
 */

/** Progress at which the header is allowed in. 0.99 is the pin's last
 *  sliver: the header arrives as the hero releases, never while a frame is
 *  still moving under it. */
const COMPLETE_AT = 0.99;

let visible = false;
const listeners = new Set<() => void>();

function publish(next: boolean) {
  if (next === visible) return;
  visible = next;
  listeners.forEach((fn) => fn());
}

/**
 * Called by whichever hero is mounted. `active` is false when there is no
 * pinned run (reduced motion, or a hero with no scroll travel) — the header is
 * simply available.
 */
export function reportHeroRun(active: boolean, progress: number): void {
  publish(!active || progress >= COMPLETE_AT);
}

/** Called when the hero unmounts, so another route can never inherit its gate. */
export function releaseHeroGate(): void {
  publish(true);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function snapshot(): boolean {
  return visible;
}

/** True when the header should be on screen. */
export function useHeroComplete(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
