import { useEffect, useRef, type ElementType, type Ref } from "react";
import { gsap } from "../../lib/gsap";
import { useHasFinePointer, usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  DECODE TEXT — the word resolves out of noise
 * ============================================================================
 *  GSAP's free `ScrambleText` plugin, used the way a terminal decodes a
 *  message: scramble to the same words the element already holds, and the
 *  letters appear to resolve rather than fade. On a hollow outlined wordmark it
 *  is doing something no other effect on this page does — the stroke is
 *  transparent, so only the skeleton of the scramble is visible.
 *
 *  It plays on hover, and only where there is a real pointer to hover with.
 *  Under reduced motion it does nothing at all: the word is simply the word,
 *  and the DOM text is never touched, so nothing depends on the effect having
 *  run.
 * ============================================================================
 */

type DecodeTextProps = {
  /** The word to decode. Kept as the element's own text, so it is there without JS. */
  text: string;
  as?: ElementType;
  className?: string;
  /** The Studio's `data-tune` id, for elements that are one of its points. */
  tuneId?: string;
  /** Seconds the scramble takes. */
  durationS?: number;
  /** `upperCase` reads as terminal noise; a character set is literal. */
  chars?: string;
};

export default function DecodeText({
  text,
  as: Tag = "span",
  className,
  tuneId,
  durationS = 0.9,
  chars = "upperCase",
}: DecodeTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const fine = useHasFinePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;

    const decode = () => {
      gsap.to(el, {
        duration: durationS,
        ease: "none",
        scrambleText: { text, chars, speed: 1.4, revealDelay: 0.12 },
      });
    };

    el.addEventListener("pointerenter", decode);
    return () => {
      el.removeEventListener("pointerenter", decode);
      gsap.killTweensOf(el);
      // The scramble rewrites the text node as it plays; putting the word back
      // is what guarantees a half-scrambled word can never survive a route
      // change or a StrictMode remount.
      el.textContent = text;
    };
  }, [text, durationS, chars, reduced, fine]);

  return (
    <Tag ref={ref as Ref<never>} data-tune={tuneId} className={className}>
      {text}
    </Tag>
  );
}
