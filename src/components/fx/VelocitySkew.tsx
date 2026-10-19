import { useEffect, useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  VELOCITY SKEW — type that remembers it was moving
 * ============================================================================
 *  Scroll fast and the block inside leans with the motion, then settles back
 *  to true. It is the effect that makes a page feel like it has inertia: the
 *  page's own speed is the animation, so there is nothing to trigger, nothing
 *  to wait for and nothing that can drift out of sync.
 *
 *  How it is kept cheap and smooth:
 *
 *    one variable    the wrapper only ever sets `--vel`; CSS turns that number
 *                    into `skewY()` (see `.velocity` in index.css). No React
 *                    state, no style recalculation of children beyond the one
 *                    transform on this element.
 *    damped          each frame the value chases a target that is itself
 *                    decaying, so a flick of the wheel produces a lean and a
 *                    graceful settle rather than a jolt. The loop stops itself
 *                    the moment both are at rest — an idle page runs no rAF.
 *    clamped         both the raw delta (a route change or anchor jump moves
 *                    thousands of pixels in one event) and the resulting angle
 *                    are capped, so nothing ever smears into illegibility.
 *
 *  Reduced motion opts out entirely: the number simply stays at zero.
 * ============================================================================
 */

type VelocitySkewProps = {
  children: ReactNode;
  className?: string;
  /** Degrees at full speed. Bigger is louder. */
  max?: number;
  /** 0–1: how quickly the lean settles. Lower is heavier. */
  ease?: number;
};

export default function VelocitySkew({
  children,
  className,
  max = 5,
  ease = 0.16,
}: VelocitySkewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let last = window.scrollY;
    let current = 0;
    let target = 0;
    let raf = 0;

    const paint = () => {
      raf = 0;
      current += (target - current) * ease;
      // The pull fades on its own, so stopping mid-scroll still settles home.
      target *= 0.86;

      if (Math.abs(current) < 0.01 && Math.abs(target) < 0.01) {
        current = 0;
        target = 0;
        el.style.setProperty("--vel", "0");
        return;
      }

      el.style.setProperty("--vel", current.toFixed(3));
      raf = requestAnimationFrame(paint);
    };

    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = Math.max(-90, Math.min(90, y - last));
      last = y;
      if (!delta) return;
      // 0.055 turns a brisk flick (~40px/frame) into the full angle.
      target = Math.max(-max, Math.min(max, target + delta * 0.055));
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.style.setProperty("--vel", "0");
    };
  }, [max, ease, reduced]);

  return (
    <div ref={ref} className={`velocity ${className ?? ""}`}>
      {children}
    </div>
  );
}
