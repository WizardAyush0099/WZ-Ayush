export const CROWS_EVENT = "itachi:crows";

/** Fling a flock of crow particles across the screen. */
export function triggerCrows(count = 14): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CROWS_EVENT, { detail: { count } }));
}
