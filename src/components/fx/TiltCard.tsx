import { useRef, type ElementType, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useHasFinePointer, usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  TILT CARD — a card with weight
 * ============================================================================
 *  The pointer lays the card back a few degrees and a soft light rides across
 *  its surface, so the frame behaves like a physical object rather than a div
 *  that changes colour on hover. Two things make it read as expensive rather
 *  than gimmicky:
 *
 *    restraint     six degrees at the very edge. Enough that the card leans
 *                  into the pointer, not enough to look like a 90s CD case.
 *    depth         children marked `data-tilt-layer` slide the *opposite* way
 *                  by the `depth` amount, which separates the picture from the
 *                  frame it sits in. The eye reads that as thickness.
 *
 *  Nothing here re-renders: the pointer handler writes one transform string
 *  and two custom properties, and the settling back is CSS (see `.tilt` in
 *  index.css), so a fast mouse across a nine-card grid costs no React work
 *  at all and the card still eases home when the pointer leaves.
 *
 *  Skipped entirely without a fine pointer and under reduced motion — a tilt
 *  you cannot control with a finger is just a wobble.
 * ============================================================================
 */

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Passed through — the card is a `data-spotlight` target like any other. */
  "data-spotlight"?: boolean;
  /** Degrees at the very edge of the card. */
  max?: number;
  /** How far `data-tilt-layer` children travel, in px. */
  depth?: number;
  /** Scale while hovered — a millimetre of lift. */
  lift?: number;
  /** Paint the specular light. Off for cards that already carry a sheen. */
  glare?: boolean;
};

export default function TiltCard({
  children,
  className,
  as: Tag = "div",
  max = 6,
  depth = 8,
  lift = 1.015,
  glare = true,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  const reset = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg) scale(1)";
    card.style.setProperty("--glare-o", "0");
    card.querySelectorAll<HTMLElement>("[data-tilt-layer]").forEach((layer) => {
      layer.style.transform = "translate3d(0, 0, 0) scale(1.02)";
    });
  };

  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduced || !fine) return;
    const card = ref.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    // −0.5 … 0.5 from the centre, so 0 is "pointer dead centre".
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.transform =
      `perspective(1100px) rotateX(${(-ny * max).toFixed(2)}deg) ` +
      `rotateY(${(nx * max).toFixed(2)}deg) scale(${lift})`;

    if (glare) {
      card.style.setProperty("--glare-x", `${((nx + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-y", `${((ny + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-o", "1");
    }

    if (depth) {
      card.querySelectorAll<HTMLElement>("[data-tilt-layer]").forEach((layer) => {
        const amount = Number(layer.dataset.tiltLayer) || depth;
        layer.style.transform =
          `translate3d(${(-nx * amount).toFixed(1)}px, ${(-ny * amount).toFixed(1)}px, 0) scale(1.06)`;
      });
    }
  };

  return (
    <Tag
      ref={ref as never}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className={`tilt ${glare ? "tilt-glare" : ""} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
