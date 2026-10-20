import { useLayoutEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion, useScrollSpin } from "../../lib/hooks";

/**
 * ============================================================================
 *  DRAW CREST — the mark is summoned, not faded in
 * ============================================================================
 *  The flourish the anime.js demos use `svg.createDrawable()` for, built on
 *  the GSAP stack this project already ships: every stroke of the Sharingan
 *  is measured with `getTotalLength`, hidden behind its own dash offset, and
 *  then drawn as the section reaches the viewport — outer ring first, then the
 *  inner ring, then the three tomoe one after another, exactly like a line
 *  being inked.
 *
 *  After the summon it keeps living: the whole crest turns with the page's
 *  scroll (`useScrollSpin`), so the mark has motion without a timer running
 *  for the rest of the visit.
 *
 *  The spin is applied to an inner wrapper because `useScrollSpin` owns the
 *  transform of the element it is given — the outer wrapper does the centering.
 *
 *  Under reduced motion nothing is drawn or measured: the crest is simply
 *  there, complete, as a static piece of art.
 * ============================================================================
 */

/** The comma of the tomoe, on the mark's own 40-unit grid (see SharinganMark). */
const TOMOE_PATH =
  "M20 11.4 C 23.4 13.6 24.4 17.6 23 20.9 C 22.1 17.9 20.2 15.6 17.4 14.5 C 18.4 13.4 19.4 12.4 20 11.4 Z";

type DrawCrestProps = {
  /** Outer positioning box — size and placement belong to the caller. */
  className?: string;
  /** Stroke colour; defaults to the live accent variable. */
  stroke?: string;
  /** Seconds before the draw begins once the crest is in view. */
  delay?: number;
};

export default function DrawCrest({
  className = "",
  stroke = "rgb(var(--blood-500-rgb))",
  delay = 0,
}: DrawCrestProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();

  // The crest winds with the page after it has been drawn — no idle timer.
  useScrollSpin(innerRef, { degreesPerPixel: 0.11 });

  useLayoutEffect(() => {
    if (reduced) return;
    const svg = svgRef.current;
    if (!svg) return;

    const strokes = Array.from(svg.querySelectorAll<SVGGeometryElement>("[data-draw]"));
    if (!strokes.length) return;

    strokes.forEach((strokeEl) => {
      const length = strokeEl.getTotalLength();
      strokeEl.style.strokeDasharray = `${length}`;
      strokeEl.style.strokeDashoffset = `${length}`;
    });

    const ctx = gsap.context(() => {
      gsap.to(strokes, {
        strokeDashoffset: 0,
        duration: 1.7,
        ease: "power2.inOut",
        stagger: 0.16,
        delay,
        scrollTrigger: { trigger: svg, start: "top 88%", once: true },
      });
    }, svg);

    return () => {
      ctx.revert();
      strokes.forEach((strokeEl) => {
        strokeEl.style.strokeDasharray = "";
        strokeEl.style.strokeDashoffset = "";
      });
    };
  }, [reduced, delay]);

  return (
    <div ref={innerRef} className={className} aria-hidden="true" style={{ willChange: "transform" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="h-full w-full drop-shadow-[0_0_16px_rgba(214,31,38,0.35)]"
      >
        <g fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round">
          {/* The rings — outer first, so the eye watches the boundary close. */}
          <circle cx="50" cy="50" r="47" strokeWidth="0.7" opacity="0.55" data-draw />
          <circle cx="50" cy="50" r="38" strokeWidth="1.1" opacity="0.85" data-draw />
          <circle cx="50" cy="50" r="30" strokeWidth="0.55" opacity="0.5" data-draw />

          {/* Three tomoe, 120° apart, each scaled from the 40-unit drawing. */}
          {[0, 120, 240].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <g transform="translate(50 50) scale(2.5) translate(-20 -20)">
                <path d={TOMOE_PATH} strokeWidth="0.55" opacity="0.9" data-draw />
                <circle cx="20" cy="8.4" r="3.1" strokeWidth="0.7" opacity="0.75" data-draw />
              </g>
            </g>
          ))}

          {/* The pupil. */}
          <circle cx="50" cy="50" r="6" strokeWidth="0.9" opacity="0.8" data-draw />
          <circle cx="50" cy="50" r="1.8" strokeWidth="1.4" opacity="0.9" data-draw />
        </g>
      </svg>
    </div>
  );
}
