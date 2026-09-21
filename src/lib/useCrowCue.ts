import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "./gsap";
import { triggerCrows } from "./fx";
import { usePrefersReducedMotion } from "./hooks";

/** Fire a crow/particle transition when the referenced section scrolls in. */
export function useCrowCue(
  ref: RefObject<HTMLElement | null>,
  count = 12,
  start = "top 60%",
): void {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      onEnter: () => triggerCrows(count),
    });
    return () => st.kill();
  }, [ref, count, start, reduced]);
}
