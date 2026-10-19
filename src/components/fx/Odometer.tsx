import { useLayoutEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  ODOMETER — a figure that rolls into place
 * ============================================================================
 *  "06" does not fade in here; each column spins upward like the drum in a
 *  mechanical counter and stops on its digit. It is the smallest possible
 *  premium effect and it costs almost nothing: ten spans per column, one
 *  transform each, played once when the figure first enters the viewport.
 *
 *  Three details:
 *
 *    no layout shift   every column is exactly one line tall and clips its
 *                      drum, so the figure occupies its final width and height
 *                      from the first paint — nothing jumps as it settles.
 *    static fallback   the drum is *rendered* already parked on its digit, so
 *                      reduced motion, no JavaScript and a scroll position
 *                      below the fold all show the correct number. The tween
 *                      only ever replays that journey.
 *    the suffix        only the digits roll. Anything around them (the "D" in
 *                      "3D", a "+", a unit) is rendered as ordinary text, so a
 *                      stat never has to be rewritten just to be countable.
 * ============================================================================
 */

type OdometerProps = {
  /** The figure as written on the page: "04", "3D", "128+". */
  value: string;
  className?: string;
  /** Seconds for one column. */
  durationS?: number;
};

/** Two cycles of 0–9, so a column can travel a full turn and land on its digit. */
const DRUM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/** Percent of the drum's own height that one digit occupies. */
const STEP = 100 / DRUM.length;

export default function Odometer({ value, className, durationS = 1.15 }: OdometerProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  // Split "3D" into "" + "3" + "D"; a figure with no digits is left alone.
  const match = /^(\D*)(\d+)(.*)$/.exec(value);
  const prefix = match?.[1] ?? "";
  const digits = match?.[2] ?? "";
  const suffix = match?.[3] ?? "";

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || !digits) return;

    const drums = Array.from(root.querySelectorAll<HTMLElement>("[data-drum]"));
    if (!drums.length) return;

    const ctx = gsap.context(() => {
      drums.forEach((drum, i) => {
        const digit = Number(drum.dataset.digit ?? "0");
        gsap.fromTo(
          drum,
          // Start one full turn earlier on the drum: the same digit, ten
          // digits away, so every column visibly travels before it stops.
          { yPercent: -(STEP * digit) },
          {
            yPercent: -(STEP * digit) - 100 / 2,
            duration: durationS,
            ease: "power4.out",
            delay: i * 0.075,
            scrollTrigger: { trigger: root, start: "top 92%", once: true },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [digits, durationS, reduced]);

  if (!digits) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={rootRef} className={className}>
      {/* The drum is decoration; the figure itself is read from here. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {prefix}
        {Array.from(digits).map((digit, i) => (
          <span key={`${digit}-${i}`} className="odo-col">
            <span
              className="odo-drum"
              data-drum=""
              data-digit={digit}
              /*
               * Parked on the landing digit before any animation runs, so the
               * correct figure is what the browser paints first.
               */
              style={{ transform: `translateY(${-STEP * (10 + Number(digit))}%)` }}
            >
              {DRUM.map((n, j) => (
                <span key={j} className="odo-digit">
                  {n}
                </span>
              ))}
            </span>
          </span>
        ))}
        {suffix}
      </span>
    </span>
  );
}
