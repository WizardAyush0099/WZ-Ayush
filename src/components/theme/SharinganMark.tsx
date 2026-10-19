import { useRef } from "react";
import { useScrollSpin } from "../../lib/hooks";

/**
 * ============================================================================
 *  SHARINGAN MARK — the house mark, at the size of a button
 * ============================================================================
 *  The theme control used to carry a two-colour swatch that read as an empty
 *  circle: on the dark themes the second half was all but invisible, so the
 *  button looked like a hole in the header. It carries the Sharingan instead,
 *  drawn on its own 40 unit grid so the strokes survive being drawn at 22px,
 *  and coloured from the live palette variables — ink for the disc, blood for
 *  the rings — so the mark flips from red-on-black to ink-on-paper with the
 *  theme it switches.
 *
 *  It turns with the page rather than on a timer: scroll down and it winds one
 *  way, scroll up and it winds back (see `useScrollSpin`). The loop never ends,
 *  the angle simply wraps, and the rotation is written straight onto the
 *  wrapper so a whole page of scrolling costs no React renders. Reduced motion
 *  holds it still.
 *
 *  Sameness on purpose: wherever this mark appears — the theme control, the
 *  Archive's statement — it is the same drawing at the same sort of size, so
 *  the site has one mark instead of several lookalikes.
 * ============================================================================
 */
export default function SharinganMark({
  className = "",
  spin = true,
}: {
  className?: string;
  /** Off holds the mark still (used where motion would fight the section). */
  spin?: boolean;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  useScrollSpin(wrapRef, { degreesPerPixel: spin ? 0.7 : 0 });

  return (
    <span
      ref={wrapRef}
      className={`inline-block ${className}`}
      style={{ willChange: "transform" }}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true" focusable="false">
        <circle cx="20" cy="20" r="19.2" fill="rgb(var(--ink-950-rgb))" />
        <circle
          cx="20"
          cy="20"
          r="18.4"
          fill="none"
          stroke="rgb(var(--blood-700-rgb))"
          strokeWidth="0.9"
          opacity="0.75"
        />

        <circle
          cx="20"
          cy="20"
          r="14"
          fill="none"
          stroke="rgb(var(--blood-600-rgb))"
          strokeWidth="1.3"
          opacity="0.9"
        />
        <circle
          cx="20"
          cy="20"
          r="11.6"
          fill="none"
          stroke="rgb(var(--blood-700-rgb))"
          strokeWidth="0.7"
          opacity="0.6"
        />

        {/* Three tomoe, 120° apart, sitting on the inner ring. */}
        {[0, 120, 240].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 20 20)`}>
            <circle cx="20" cy="8.4" r="3.1" fill="rgb(var(--blood-500-rgb))" />
            <path
              d="M20 11.4 C 23.4 13.6 24.4 17.6 23 20.9 C 22.1 17.9 20.2 15.6 17.4 14.5 C 18.4 13.4 19.4 12.4 20 11.4 Z"
              fill="rgb(var(--blood-500-rgb))"
              opacity="0.85"
            />
            <circle cx="20" cy="8.4" r="1.05" fill="rgb(var(--ink-950-rgb))" opacity="0.9" />
          </g>
        ))}

        <circle cx="20" cy="20" r="3" fill="rgb(var(--blood-700-rgb))" opacity="0.7" />
        <circle cx="20" cy="20" r="1.5" fill="rgb(var(--blood-400-rgb))" />
      </svg>
    </span>
  );
}
