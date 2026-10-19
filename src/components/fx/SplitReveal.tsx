import { useLayoutEffect, useRef, type ElementType, type Ref } from "react";
import { gsap, SplitText } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  SPLIT REVEAL — a headline that rises out of its own mask
 * ============================================================================
 *  The trick the best studio sites use on every heading, done with GSAP's free
 *  `SplitText`: the sentence is split into words, each word gets a clipping
 *  wrapper, and the words travel up from below that wrapper as the element
 *  reaches the viewport. Nothing about it is a fade — the type is masked, so it
 *  reads like film titles rather than like CSS.
 *
 *  Three details that matter:
 *
 *    aria          `aria: "auto"` keeps the sentence whole for screen readers
 *                  (they read the label, not twenty separate words) while the
 *                  visual split does its work.
 *    layout effect the split happens in `useLayoutEffect`, before the browser
 *                  paints, so the un-split sentence never flashes for a frame.
 *    reduced       with `prefers-reduced-motion` the effect never runs and the
 *                  line is simply there, whole and readable.
 * ============================================================================
 */

type SplitRevealProps = {
  /** The line itself. Pass plain text — it is what gets split. */
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
  /** The Studio's `data-tune` id, for elements that are one of its points. */
  tuneId?: string;
  /** Words rise out of a mask (the default) or characters cascade. */
  type?: "words" | "chars";
  /** Seconds between one word and the next. */
  stagger?: number;
  delay?: number;
  /** `scroll` plays as the element arrives; `load` plays immediately. */
  trigger?: "scroll" | "load";
};

export default function SplitReveal({
  text,
  as: Tag = "span",
  className,
  id,
  tuneId,
  type = "words",
  stagger = 0.07,
  delay = 0,
  trigger = "scroll",
}: SplitRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const split = SplitText.create(el, {
      type,
      // Only words take a mask: a cascade of masked characters fragments the
      // letterforms at small sizes, so chars rise without one.
      mask: type === "words" ? "words" : undefined,
      aria: "auto",
    });
    const targets: Element[] = type === "chars" ? split.chars : split.words;

    /*
     * Descenders. A word mask clips at the word's own line box, and this page
     * sets editorial leading (1.02 on the intro headline) — tight enough that
     * the tail of a "g" hangs below it and would be sliced off. A slice of
     * bottom padding widens the clip to include it, and the same value as a
     * negative margin keeps the line box, and therefore the layout, exactly the
     * height it was.
     */
    if (type === "words" && split.masks.length) {
      gsap.set(split.masks, { paddingBottom: "0.16em", marginBottom: "-0.16em" });
    }

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        yPercent: 118,
        opacity: 0,
        duration: 1.15,
        ease: "power4.out",
        stagger,
        delay,
        ...(trigger === "scroll"
          ? { scrollTrigger: { trigger: el, start: "top 88%", once: true } }
          : {}),
      });
    }, el);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [text, type, stagger, delay, trigger, reduced]);

  return (
    <Tag ref={ref as Ref<never>} id={id} data-tune={tuneId} className={className}>
      {text}
    </Tag>
  );
}
