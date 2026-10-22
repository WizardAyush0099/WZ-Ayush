import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  RIPPLE SURFACE — the band acknowledges where it was touched
 * ============================================================================
 *  A decorative layer laid over a real section of the page. Any pointer press
 *  inside that section blooms a ring at the exact point of contact and lets it
 *  travel outward until it fades. It costs nothing while idle: there is no
 *  loop, no timers and no measurements — a ring exists only while it is
 *  animating, and removes itself the moment its animation ends.
 *
 *  The layer is `pointer-events-none` and `aria-hidden`: it never steals a
 *  click from anything underneath, and a screen reader never learns it exists.
 *  The listener sits on the host element instead, so the press that opened a
  *  link inside the section still blooms — the surface answers the finger, not
 *  the control.
 *
 *  Touch devices get the most from it (that is where a press is loudest), but
 *  it runs for the pointer too. Under reduced motion the component renders
 *  nothing at all: a ring is pure decoration, so the whole gesture simply
 *  disappears rather than being reduced to a stub.
 * ============================================================================
 */

type Ring = { id: number; x: number; y: number };

/** Keep only a handful alive at once — a rapid tapper must not grow the tree. */
const MAX_RINGS = 5;

export default function RippleSurface({ className = "" }: { className?: string }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [rings, setRings] = useState<Ring[]>([]);
  const nextId = useRef(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    // The layer must be pointer-events-none, so the press is heard on its
    // parent band — the element this layer is painted across.
    const host = layerRef.current?.parentElement;
    if (!host) return;

    const onDown = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const ring: Ring = {
        id: ++nextId.current,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setRings((list) => [...list.slice(-(MAX_RINGS - 1)), ring]);
    };

    host.addEventListener("pointerdown", onDown, { passive: true });
    return () => host.removeEventListener("pointerdown", onDown);
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${className}`}
    >
      {rings.map((ring) => (
        <span
          key={ring.id}
          className="ripple-ring"
          style={{ left: ring.x, top: ring.y }}
          onAnimationEnd={() =>
            setRings((list) => list.filter((item) => item.id !== ring.id))
          }
        />
      ))}
    </div>
  );
}
