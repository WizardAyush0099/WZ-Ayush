import { useEffect, useRef, useState } from "react";

/**
 * ============================================================================
 *  LIVE PREVIEW FRAME — a real site, framed at its own desktop size
 * ============================================================================
 *  Every template in this project is a complete HTML site with real
 *  breakpoints, so simply dropping one into a card-sized iframe makes it lay
 *  itself out at card width: the navigation collapses to a burger, the hero
 *  stacks, and the visitor judges a mobile page while thinking they are looking
 *  at the template. That is what "the templates are barely visible" means.
 *
 *  So the embedded site is laid out at a genuine desktop width (1280px, where
 *  its `lg`/`xl` styles are live) and then scaled down by exactly the ratio the
 *  frame needs. The whole composition is visible — the design the owner built —
 *  instead of a narrow slice of it.
 *
 *  Below `minDesignWidth` there is nothing left to shrink: a phone-sized card
 *  is shown the site's own mobile layout at 1:1, which is both legible and
 *  honest. The iframe is always inert (`pointer-events-none`, not tabbable, not
 *  announced) so the card around it keeps ownership of scroll, clicks and
 *  focus.
 * ============================================================================
 */

const DESIGN_WIDTH = 1280;
const MIN_DESIGN_WIDTH = 620;

type Props = {
  src: string;
  /** Accessible-only: the frame is aria-hidden, so this is for devtools. */
  title: string;
  className?: string;
  /** Layout viewport used when the frame is wide enough to scale. */
  designWidth?: number;
  /** Frame width below which the site is left at its natural layout. */
  minDesignWidth?: number;
};

export default function LivePreviewFrame({
  src,
  title,
  className = "",
  designWidth = DESIGN_WIDTH,
  minDesignWidth = MIN_DESIGN_WIDTH,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  /**
   * A framed site is a whole second page — six of them on the homepage shelf
   * are six pages' worth of requests and layout. The frame is therefore mounted
   * only once its card is near the viewport, and stays mounted after that so a
   * scroll back does not reload it. `loading="lazy"` alone was not enough: the
   * shelf lays the blocks out side by side, so browsers fetched them long
   * before the visitor had scrolled to them.
   */
  const [nearView, setNearView] = useState(false);

  // Measure the box the frame has to fill. A ResizeObserver (rather than a
  // window listener) also catches the pinned shelf resizing its blocks.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (nearView) return;
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearView(true);
          observer.disconnect();
        }
      },
      // Start a little before it is visible — including sideways, because the
      // shelf slides horizontally — so the frame has painted by the time the
      // card is on screen.
      { rootMargin: "480px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearView]);

  const scaled = size.width >= minDesignWidth;
  const scale = scaled && size.width ? size.width / designWidth : 1;
  // The iframe is laid out larger than its box on purpose — the transform is
  // what brings it back down, so its own `vh` maths stays desktop-shaped.
  const frameWidth = scaled ? designWidth : size.width;
  const frameHeight = scale > 0 ? size.height / scale : 0;

  return (
    // No positioning utility of its own: the caller decides whether this is a
    // flow block or an absolutely-placed overlay, and the iframe inside stays
    // in normal flow with an explicit width/height so the transform is the only
    // thing scaling it.
    <div ref={wrapRef} className={`overflow-hidden bg-ink-950 ${className}`}>
      {nearView ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          style={{
            width: frameWidth ? `${frameWidth}px` : "100%",
            height: frameHeight ? `${frameHeight}px` : "100%",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="pointer-events-none block border-0"
        />
      ) : null}
    </div>
  );
}
