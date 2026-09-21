import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * Sharingan-inspired cinematic effect: concentric rings, three tomoe and a
 * slow counter-rotating halo. Opacity/scale are driven from the hero so the
 * pattern only emerges as the user engages with it.
 */
export default function Sharingan() {
  const rotRef = useRef<SVGGElement>(null);
  const haloRef = useRef<SVGGElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      if (rotRef.current) {
        gsap.to(rotRef.current, {
          rotation: 360,
          duration: 90,
          repeat: -1,
          ease: "none",
          transformOrigin: "50% 50%",
        });
      }
      if (haloRef.current) {
        gsap.to(haloRef.current, {
          rotation: -360,
          duration: 150,
          repeat: -1,
          ease: "none",
          transformOrigin: "50% 50%",
        });
      }
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div className="pointer-events-none relative h-full w-full">
      {/* Soft red bloom behind the pattern */}
      <div
        className="absolute inset-[12%] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(214,31,38,0.34) 0%, rgba(140,11,16,0.18) 42%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 400 400" className="relative h-full w-full" aria-hidden="true">
        <g ref={haloRef} opacity="0.5">
          <circle cx="200" cy="200" r="196" fill="none" stroke="#5e070b" strokeWidth="1" strokeDasharray="2 9" />
          <circle cx="200" cy="200" r="176" fill="none" stroke="#3a0407" strokeWidth="1" />
        </g>

        <g ref={rotRef}>
          <circle cx="200" cy="200" r="158" fill="none" stroke="#8c0b10" strokeWidth="1.4" opacity="0.9" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="#b31115" strokeWidth="1.2" opacity="0.75" />
          <circle cx="200" cy="200" r="78" fill="none" stroke="#b31115" strokeWidth="1" opacity="0.6" />

          {/* Three tomoe */}
          {[0, 120, 240].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 200 200)`}>
              <circle cx="200" cy="80" r="15" fill="#d61f26" opacity="0.92" />
              <path
                d="M200 95 C 214 108 220 128 212 146 C 206 130 196 118 182 112 C 190 104 196 98 200 95 Z"
                fill="#b31115"
                opacity="0.85"
              />
              <circle cx="200" cy="80" r="4.5" fill="#1e0203" />
            </g>
          ))}

          <circle cx="200" cy="200" r="20" fill="#8c0b10" opacity="0.5" />
          <circle cx="200" cy="200" r="9" fill="#e0171c" />
        </g>
      </svg>
    </div>
  );
}
