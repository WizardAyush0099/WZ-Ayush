import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { hero } from "../data/content";
import { gsap } from "../lib/gsap";
import { usePrefersReducedMotion } from "../lib/hooks";

/**
 * ============================================================================
 *  PRELOADER — the title card, then the shutter
 * ============================================================================
 *  Two moments instead of one:
 *
 *    the entrance   the wordmark's characters rise out of their own line mask
 *                   the instant the card mounts, while the counter runs under
 *                   them — the first motion of the site is typography, not a
 *                   spinner.
 *    the exit       at 100 the copy is swept away and the card itself splits
 *                   in half along a crimson seam: the top panel climbs, the
 *                   bottom panel drops, and the film is already running
 *                   underneath. `onDone` fires as the shutter starts, so the
 *                   hero is alive behind it rather than starting after it.
 *
 *  Everything is transform/opacity (compositor-only), the scroll lock is
 *  released on completion *and* on unmount, and under reduced motion the card
 *  keeps its original behaviour: a short hold, then a plain fade.
 * ============================================================================
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(reduced ? 100 : 0);
  const [hidden, setHidden] = useState(false);
  const doneRef = useRef(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  /* The wordmark rises out of its mask, once, on mount. */
  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-pre-char]", {
        yPercent: 115,
        duration: 0.95,
        ease: "power4.out",
        stagger: 0.04,
        delay: 0.12,
      });
    }, contentRef);
    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    const body = document.body;
    body.style.overflow = "hidden";

    if (reduced) {
      setProgress(100);
      const t = window.setTimeout(() => finish(), 200);
      return () => {
        window.clearTimeout(t);
        // Never leave the page scroll-locked if this unmounts mid-flight.
        document.body.style.overflow = "";
      };
    }

    let raf = 0;
    const start = performance.now();
    // Deliberately unhurried: the counter and the hairline fill at a calmer
    // pace so the reveal lands as a title card rather than a loading spinner.
    const DURATION = 2200;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      tlRef.current?.kill();
      // Safety net: release the scroll lock even if the reveal never finished.
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setProgress(100);

    const content = contentRef.current;
    const top = topRef.current;
    const bottom = bottomRef.current;
    const seam = seamRef.current;

    // Reduced motion (or a missing node): hold, then a plain fade — the
    // original behaviour, which has never needed the shutter.
    if (reduced || !content || !top || !bottom) {
      window.setTimeout(() => {
        setHidden(true);
        document.body.style.overflow = "";
        onDone();
      }, 380);
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setHidden(true);
        document.body.style.overflow = "";
      },
    });
    tlRef.current = tl;

    tl.to(content, { autoAlpha: 0, y: -16, duration: 0.3, ease: "power2.in" })
      // The seam lights up exactly where the card is about to part.
      .set(seam, { scaleX: 0, autoAlpha: 1 })
      .to(seam, { scaleX: 1, duration: 0.34, ease: "power3.out" }, "<")
      // The film underneath is live from the first frame of the opening.
      .add(() => onDone())
      .to(top, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, "open")
      .to(bottom, { yPercent: 100, duration: 0.85, ease: "power4.inOut" }, "open")
      .to(seam, { autoAlpha: 0, duration: 0.55, ease: "power2.out" }, "open+=0.3");
  };

  if (hidden) return null;

  const complete = progress >= 100;

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden"
      style={{
        pointerEvents: complete ? "none" : "auto",
        // The shutter path animates its own halves; only the reduced-motion
        // hold-and-fade needs the card itself to dissolve.
        opacity: reduced && complete ? 0 : 1,
        transition: "opacity 500ms ease",
      }}
      aria-hidden="true"
    >
      {/* The two halves of the shutter — together they tile the screen. */}
      <div
        ref={topRef}
        className="absolute inset-x-0 top-0 h-[calc(50%+1px)] bg-ink-950 will-change-transform"
      />
      <div
        ref={bottomRef}
        className="absolute inset-x-0 bottom-0 h-[calc(50%+1px)] bg-ink-950 will-change-transform"
      />
      {/* The seam between them: a crimson hairline that flashes on the cut. */}
      <div
        ref={seamRef}
        className="absolute inset-x-0 top-1/2 z-10 h-px origin-center scale-x-0 bg-blood-500 opacity-0 shadow-[0_0_24px_rgba(214,31,38,0.9)]"
      />

      <div
        ref={contentRef}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-6"
      >
        <span className="font-accent text-[13px] tracking-[0.5em] text-blood-500/80">
          {hero.accent}
        </span>
        {/* Not a heading: this overlay is `aria-hidden`, and the page already
            has exactly one <h1> — the headline in the intro section. The
            wrapper is the mask the characters rise out of. */}
        <span className="display block overflow-hidden text-center text-[13vw] text-bone/90 sm:text-7xl">
          {hero.title.split("").map((char, index) => (
            <span
              key={`${char}-${index}`}
              data-pre-char
              className="inline-block will-change-transform"
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
        <div className="relative h-px w-[220px] overflow-hidden bg-bone/10 sm:w-[320px]">
          <div
            className="absolute inset-y-0 left-0 bg-blood-500"
            style={{ width: `${progress}%`, transition: "width 120ms linear" }}
          />
        </div>
        <span className="font-body text-[11px] tracking-cinematic text-bone-dim">
          {String(progress).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}
