import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * ============================================================================
 *  ROTATING TEXT — the sentence that keeps rewriting itself
 * ============================================================================
 *  One word of a line hands over to the next on a beat: the outgoing word
 *  leaves the mask upward while the incoming one rises into it (`.live-word`
 *  in `index.css`). It is a tiny piece of motion, but it makes the intro read
 *  as alive rather than printed — and it carries the trades the templates are
 *  drawn for without adding a paragraph to say so.
 *
 *  Mechanics that matter:
 *
 *    reserve     the longest phrase is laid out invisibly behind the line, so
 *                the words around it never shift as the phrase changes.
 *    one beat    a single interval, cleared on unmount; no per-frame loop.
 *    reduced     under `prefers-reduced-motion` the first phrase simply stays.
 *    spoken      the animated word is `aria-hidden` and the whole set is read
 *                once, so a screen reader is not interrupted every few seconds.
 * ============================================================================
 */
export default function RotatingText({
  items,
  hold = 2.8,
  className = "",
}: {
  items: readonly string[];
  /** Seconds each phrase holds the line. */
  hold?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || items.length < 2) return;
    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      hold * 1000,
    );
    return () => window.clearInterval(id);
  }, [hold, items.length, reduced]);

  const word = items[index] ?? items[0] ?? "";
  const widest = items.reduce((longest, item) => (item.length > longest.length ? item : longest), "");

  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <span aria-hidden="true" className="invisible whitespace-nowrap">
        {widest}
      </span>
      <span
        key={reduced ? "static" : word}
        aria-hidden="true"
        className={`absolute inset-0 whitespace-nowrap ${reduced ? "" : "live-word"} ${className}`}
      >
        {word}
      </span>
      <span className="sr-only">{items.join(", ")}</span>
    </span>
  );
}
