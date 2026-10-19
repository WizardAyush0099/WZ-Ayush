import { useEffect, useRef } from "react";
import { useHasFinePointer, usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  CURSOR TRAIL — the frames remember where the pointer has been
 * ============================================================================
 *  Move the pointer across the section and a handful of fading copies of its
 *  pictures follow the path: the newest at the pointer, each older one chasing
 *  the one ahead of it, thinning and dimming as it goes. It is the effect the
 *  premium registries ship as an "image cursor trail", and it does for a plate
 *  of stills what the spotlight does for a card.
 *
 *  The mechanic, which is why it costs almost nothing:
 *
 *    one listener      a single `pointermove` on the container decides which
 *                      picture is "live" and records the pointer position.
 *    a snake           inside one rAF, each ghost eases toward the *next* ghost's
 *                      position rather than to the pointer, so the trail curves
 *                      behind the cursor naturally instead of snapping.
 *    transforms only   every ghost is positioned with `translate3d` and faded
 *                      with `opacity` — compositor work, no layout, and the
 *                      loop parks itself when the pointer stops moving.
 *
 *  Static and invisible until a real pointer arrives: the layer is
 *  `pointer-events-none` and hidden on touch and under reduced motion.
 * ============================================================================
 */

export type TrailFrame = { src: string; alt: string };

type CursorTrailProps = {
  frames: readonly TrailFrame[];
  className?: string;
  /** How many ghosts follow the pointer. Six reads as a trail; more reads as soup. */
  count?: number;
  /** 0–1: how closely each ghost chases the one ahead. Higher is tighter. */
  follow?: number;
};

export default function CursorTrail({
  frames,
  className,
  count = 6,
  follow = 0.24,
}: CursorTrailProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || reduced || !fine || !frames.length) return;

    const ghosts = Array.from(layer.querySelectorAll<HTMLElement>("[data-ghost]"));
    if (!ghosts.length) return;

    // Every ghost starts stacked off-screen, so nothing is visible until the
    // pointer actually moves inside the section.
    const positions = ghosts.map(() => ({ x: -1000, y: -1000 }));
    let pointer = { x: -1000, y: -1000 };
    let active = false;
    let live = 0;
    let raf = 0;

    const paint = () => {
      raf = 0;
      let settling = false;

      for (let i = ghosts.length - 1; i >= 0; i -= 1) {
        const target = i === 0 ? pointer : positions[i - 1];
        const position = positions[i];
        position.x += (target.x - position.x) * follow;
        position.y += (target.y - position.y) * follow;

        const ghost = ghosts[i];
        const lag = Math.hypot(pointer.x - position.x, pointer.y - position.y);
        if (lag > 0.5) settling = true;

        ghost.style.transform = `translate3d(${position.x.toFixed(1)}px, ${position.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${ghost.dataset.size})`;
        // The tail end of the trail is the faint one.
        const depth = 1 - i / ghosts.length;
        ghost.style.opacity = active ? String((0.05 + depth * 0.5).toFixed(3)) : "0";
      }

      if (settling) raf = requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const item = target?.closest<HTMLElement>("[data-trail-frame]");

      if (!item) {
        if (active) {
          active = false;
          if (!raf) raf = requestAnimationFrame(paint);
        }
        return;
      }

      // Which picture is being played is read from the element itself, so the
      // component needs no per-frame state and no React re-render.
      const index = Number(item.dataset.trailFrame ?? "0");
      if (Number.isFinite(index) && index !== live) {
        live = index;
        const frame = frames[index % frames.length];
        ghosts.forEach((ghost) => {
          const image = ghost.querySelector("img");
          if (image && frame) {
            image.src = frame.src;
            image.alt = "";
          }
        });
      }

      const box = layer.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
      if (!active) active = true;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      active = false;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const container = layer.parentElement ?? layer;
    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [frames, count, follow, reduced, fine]);

  if (reduced || !fine || !frames.length) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden ${className ?? ""}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          data-ghost=""
          data-size={(1 - i * 0.08).toFixed(2)}
          className="absolute left-0 top-0 opacity-0 will-change-transform"
          style={{ width: "clamp(120px, 16vw, 230px)" }}
        >
          <div className="border border-bone/15 bg-ink-950/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-[1px]">
            <img
              src={frames[i % frames.length]?.src ?? ""}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
