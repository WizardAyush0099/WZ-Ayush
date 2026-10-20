import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import SharinganMark from "../theme/SharinganMark";

/**
 * ============================================================================
 *  ROUTE WIPE — the cut between pages
 * ============================================================================
 *  Every award site this one is aiming at has a transition between routes: the
 *  page does not simply swap, something *travels* across the screen and the new
 *  page is revealed behind it. Here it is a blade of ink with crimson edges —
 *  the sheet sweeps in from the left, the house mark flashes at the moment it
 *  covers the screen, and the sheet sweeps out to the right leaving the new
 *  route behind it.
 *
 *  Mechanics that matter:
 *
 *    hash only     it listens to `hashchange`, which is the only thing this
 *                  router has — in-page scrolling never touches the hash, so
 *                  a click on a section link can never fire the wipe.
 *    decorative    the SPA has already swapped its route by the time the event
 *                  arrives; the sheet is a film cut laid over the top, never a
 *                  gate the content has to wait on.
 *    pointer-free  the layer is `pointer-events-none` and self-terminates, so
 *                  it can never swallow a click, and overlapping navigations
 *                  simply restart the same timeline.
 *    reduced       under `prefers-reduced-motion` the component renders
 *                  nothing at all.
 * ============================================================================
 */
export default function RouteWipe() {
  const sheetRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const sheet = sheetRef.current;
    const mark = markRef.current;
    if (!sheet || !mark) return;

    let tl: gsap.core.Timeline | null = null;

    const play = () => {
      tl?.kill();
      gsap.set(sheet, { xPercent: -105, autoAlpha: 1 });
      gsap.set(mark, { autoAlpha: 0, scale: 0.82 });
      tl = gsap.timeline({
        onComplete: () => {
          gsap.set(sheet, { autoAlpha: 0 });
          tl = null;
        },
      });
      // In — the leading edge crosses the screen in under half a second.
      tl.to(sheet, { xPercent: 0, duration: 0.4, ease: "power4.in" })
        // The mark blooms exactly while the sheet owns the screen.
        .to(mark, { autoAlpha: 1, scale: 1, duration: 0.22, ease: "power2.out" }, 0.24)
        .to(mark, { autoAlpha: 0, scale: 1.12, duration: 0.2, ease: "power2.in" }, 0.46)
        // Out — the new page is revealed behind the trailing edge.
        .to(sheet, { xPercent: 105, duration: 0.52, ease: "power3.inOut" }, 0.5);
    };

    window.addEventListener("hashchange", play);
    return () => {
      window.removeEventListener("hashchange", play);
      tl?.kill();
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[92] overflow-hidden"
    >
      <div
        ref={sheetRef}
        data-route-wipe
        className="absolute inset-0 invisible will-change-transform"
        style={{
          background:
            "linear-gradient(90deg, rgba(179,17,21,0) 0%, rgba(179,17,21,0.55) 3%, #08080a 11%, #08080a 89%, rgba(179,17,21,0.55) 97%, rgba(179,17,21,0) 100%)",
        }}
      >
        <div
          ref={markRef}
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-0 sm:h-32 sm:w-32"
        >
          <SharinganMark className="h-full w-full drop-shadow-[0_0_36px_rgba(214,31,38,0.65)]" />
        </div>
      </div>
    </div>
  );
}
