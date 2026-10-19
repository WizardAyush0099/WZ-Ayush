import { useEffect, useRef } from "react";

/**
 * ============================================================================
 *  SCROLL PROGRESS — how much of the page is behind you
 * ============================================================================
 *  A hairline at the very top of the viewport that fills as the page is read.
 *  It is the one "effect" here that is also a control: on a page this long —
 *  a pinned film, a pinned shelf, three galleries — it is genuinely useful to
 *  know the distance left.
 *
 *  Written straight onto the element inside a rAF, so a scroll costs one
 *  transform and no renders, and it is deliberately *not* motion: the bar only
 *  moves because the visitor moved the page, so it stays on under reduced
 *  motion (it is information, not decoration).
 * ============================================================================
 */

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;

    const paint = () => {
      raf = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // A page shorter than the window has no progress to report.
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
      bar.style.opacity = progress > 0.002 ? "1" : "0";
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[95] h-px bg-transparent"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-blood-700 via-blood-500 to-blood-300 opacity-0 transition-opacity duration-500"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
