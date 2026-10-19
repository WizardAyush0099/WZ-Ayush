import type { ReactNode } from "react";

/**
 * ============================================================================
 *  MARQUEE — the endless ticker
 * ============================================================================
 *  One list, printed twice, sliding exactly half its own width and then
 *  repeating: the seam is invisible because half of the track is identical to
 *  the other half. The animation is a CSS keyframe (`marquee` in index.css), so
 *  it runs on the compositor and costs nothing while the visitor scrolls, and
 *  the strip pauses under the pointer so a long word can actually be read.
 *
 *  The duplicate is `aria-hidden` — a screen reader hears the list once, in
 *  order, rather than every word twice.
 * ============================================================================
 */

type MarqueeProps = {
  items: readonly string[];
  className?: string;
  /** Seconds for one full pass. Bigger is calmer. */
  durationS?: number;
  /** The mark between two entries. Drawn between EVERY pair, including the last. */
  separator?: ReactNode;
};

export default function Marquee({
  items,
  className,
  durationS = 46,
  separator = <span aria-hidden="true" className="text-blood-500/60">◆</span>,
}: MarqueeProps) {
  return (
    <div className={`marquee ${className ?? ""}`}>
      <div
        className="marquee-track flex w-max items-center"
        style={{ animationDuration: `${durationS}s` }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {items.map((item) => (
              <span
                key={`${copy}-${item}`}
                className="flex shrink-0 items-center gap-6 px-6 font-display text-base uppercase tracking-[0.16em] text-bone-muted sm:gap-8 sm:px-8 sm:text-lg"
              >
                {item}
                {separator}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
