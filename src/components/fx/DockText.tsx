import { useEffect, useRef } from "react";
import { useHasFinePointer, usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  DOCK TEXT — letters that answer the pointer
 * ============================================================================
 *  The word sits still until the pointer travels across it, then each letter
 *  swells and lifts with a falloff by distance — the way a dock magnifies the
 *  icons nearest the cursor — and settles back as the pointer leaves. The text
 *  that reads is the same text; only its scale changes.
 *
 *  Two things keep it honest:
 *
 *    the DOM is untouched   the word is split once, in a layout effect, into
 *                           one span per character. The accessible name stays
 *                           the whole word (`aria-label` on the wrapper, the
 *                           letters `aria-hidden`), so a screen reader never
 *                           spells it out letter by letter.
 *    no React work          every frame writes one `transform` per letter
 *                           straight to the element inside a rAF, and the loop
 *                           stops the moment no letter is displaced. Twenty
 *                           letters cost twenty transform writes, no renders.
 *
 *  Skipped on touch (there is no hover to track) and under reduced motion,
 *  where the word is simply rendered as plain text.
 *
 *  Built for one word: the letters are inline-block so they can transform,
 *  which means the run cannot break across lines. Use it on a wordmark, not on
 *  a sentence.
 * ============================================================================
 */

type DockTextProps = {
  text: string;
  className?: string;
  /** Scale at the pointer's own position. Falls off to 1 at `reach`. */
  max?: number;
  /** How far the pull extends, in px from the pointer to the letter's centre. */
  reach?: number;
};

export default function DockText({ text, className, max = 1.45, reach = 170 }: DockTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;

    const letters = Array.from(el.querySelectorAll<HTMLElement>("[data-dock-letter]"));
    if (!letters.length) return;

    let raf = 0;
    let pointerX = Number.NaN;
    let pointerY = Number.NaN;

    const paint = () => {
      raf = 0;
      let moving = false;
      for (const letter of letters) {
        // Each letter's scale is a function of its distance from the pointer.
        // The vertical term matters: a word docked from above should not
        // respond while the pointer is a screen away below it.
        const box = letter.getBoundingClientRect();
        const dx = pointerX - (box.left + box.width / 2);
        const dy = pointerY - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy);
        const proximity = Math.max(0, 1 - distance / reach);
        // A cosine falloff reads smoother than a linear ramp.
        const eased = (1 - Math.cos(proximity * Math.PI)) / 2;
        const scale = 1 + (max - 1) * eased;

        letter.style.transform =
          scale > 1.004
            ? `translateY(${(-(scale - 1) * 0.34).toFixed(4)}em) scale(${scale.toFixed(4)})`
            : "";

        if (scale > 1.004) moving = true;
      }
      // Keep the loop alive while anything is still magnified, so the word
      // eases back home after the pointer leaves instead of freezing mid-scale.
      if (moving) raf = requestAnimationFrame(paint);
    };

    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      const within =
        event.clientX > box.left - reach * 0.8 &&
        event.clientX < box.right + reach * 0.8 &&
        event.clientY > box.top - reach * 0.8 &&
        event.clientY < box.bottom + reach * 0.8;

      if (!within) {
        pointerX = Number.NaN;
        pointerY = Number.NaN;
      } else {
        pointerX = event.clientX;
        pointerY = event.clientY;
      }
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      pointerX = Number.NaN;
      pointerY = Number.NaN;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      letters.forEach((letter) => {
        letter.style.transform = "";
      });
    };
  }, [text, max, reach, reduced, fine]);

  return (
    <span ref={ref} className={className}>
      {/* The word is read from here, whole — never letter by letter. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((character, i) =>
          character === " " ? (
            <span key={`gap-${i}`}> </span>
          ) : (
            <span key={`${character}-${i}`} data-dock-letter="" className="dock-letter">
              {character}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
