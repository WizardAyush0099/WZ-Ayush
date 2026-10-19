import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "../../lib/gsap";
import { useHasFinePointer, usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  MAGNETIC — a button that leans towards the pointer
 * ============================================================================
 *  Wrap any control in this and it follows the cursor a little while it is
 *  hovered, then springs home when the pointer leaves. It is the single
 *  cheapest way to make a call to action feel expensive, and it is the effect
 *  every one of the component galleries you have seen ships as “Magnetic
 *  Button”.
 *
 *  The follow is `gsap.quickTo`, which writes to the element's transform once
 *  per frame — the container is never re-rendered, so a pointer moving across
 *  the button costs nothing but a compositor update. `strength` sets how far it
 *  leans (a third of the pointer's offset from the centre is the sweet spot:
 *  enough to feel alive, not enough to look broken), and `tilt` adds a small
 *  rotation for wrapping a whole row.
 *
 *  Fine pointers only, and nothing at all under reduced motion.
 * ============================================================================
 */

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** 0 → inert, 1 → the child tracks the pointer exactly. */
  strength?: number;
  /** Degrees of lean at the edge of the element. 0 disables it. */
  tilt?: number;
};

export default function Magnetic({
  children,
  className,
  strength = 0.32,
  tilt = 0,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });
    const rTo = gsap.quickTo(el, "rotate", { duration: 0.7, ease: "power3.out" });

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      if (tilt) rTo((dx / Math.max(1, rect.width / 2)) * tilt);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
      if (tilt) rTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [reduced, fine, strength, tilt]);

  return (
    <span
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      style={{ willChange: "transform" }}
    >
      {children}
    </span>
  );
}
