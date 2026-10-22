import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  ODOMETER — a figure that rolls into place
 * ============================================================================
 *  "04" does not fade in; each digit drops into its slot from one place above
 *  the line, staggered column by column, like the drums of a mechanical
 *  counter. It is the smallest possible premium effect and it costs almost
 *  nothing: one span per digit, one transform each, played once when the
 *  figure first enters the viewport.
 *
 *  The important part is what it looks like when nothing happens. The correct
 *  digit is *rendered* in the slot — the animation only ever moves it and lets
 *  go — so reduced motion, no JavaScript, a broken observer and a scroll
 *  position below the fold all show the right number. There is no "parked
 *  position" to compute and therefore no parked position to get wrong: the
 *  resting state of the markup is the answer, and the motion is a round trip
 *  away from it and back.
 *
 *  The roll is CSS (`.odo-col.is-rolling` in index.css), triggered once by an
 *  IntersectionObserver. No GSAP, no ScrollTrigger, no timers left running.
 *
 *  The suffix: only the digits roll. Anything around them (the "D" in "3D", a
 *  "+", a unit) is rendered as ordinary text, so a stat never has to be
 *  rewritten just to be countable.
 * ============================================================================
 */

type OdometerProps = {
  /** The figure as written on the page: "04", "3D", "128+". */
  value: string;
  className?: string;
  /** Seconds for one column's roll. */
  durationS?: number;
};

export default function Odometer({ value, className, durationS = 1.1 }: OdometerProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  // Split "3D" into "" + "3" + "D"; a figure with no digits is left alone.
  const match = /^(\D*)(\d+)(.*)$/.exec(value);
  const prefix = match?.[1] ?? "";
  const digits = match?.[2] ?? "";
  const suffix = match?.[3] ?? "";

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || !digits) return;

    const columns = Array.from(root.querySelectorAll<HTMLElement>("[data-roll]"));
    if (!columns.length) return;

    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fired || !entries.some((entry) => entry.isIntersecting)) return;
        fired = true;
        observer.disconnect();
        columns.forEach((column, i) => {
          column.style.setProperty("--roll-duration", `${durationS}s`);
          column.style.setProperty("--roll-delay", `${i * 0.08}s`);
          column.classList.add("is-rolling");
        });
      },
      { threshold: 0.5 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [digits, durationS, reduced]);

  if (!digits) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={rootRef} className={className}>
      {/* The figure is read from here, whole — never digit by digit. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {prefix}
        {Array.from(digits).map((digit, i) => (
          <span key={`${digit}-${i}`} data-roll="" className="odo-col">
            <span className="odo-digit">{digit}</span>
          </span>
        ))}
        {suffix}
      </span>
    </span>
  );
}
