import { useEffect, useRef } from "react";
import { statement } from "../../data/content";
import { gsap, SplitText } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import Marquee from "../fx/Marquee";
import VelocitySkew from "../fx/VelocitySkew";

/**
 * ============================================================================
 *  STATEMENT — the kinetic band
 * ============================================================================
 *  The one moment on the page where the type is the animation. The line is
 *  split into words and every word rises from a quarter-opacity as the band
 *  crosses the screen, so the sentence assembles itself at the speed the
 *  visitor scrolls — scroll back up and it comes apart again. That is the whole
 *  mechanic; there is no timer, no autoplay and nothing to wait for.
 *
 *  Two deliberate choices:
 *
 *    no blur per word   blurring twenty-five elements on every scroll frame is
 *                       the kind of effect that looks good in a demo and drops
 *                       frames on a laptop. Opacity and offset only, so the
 *                       whole band stays a compositor job.
 *    transform-free     nothing here is pinned or sticky, so the Studio can
 *                       size, tilt and nudge the band like any other section.
 *
 *  Under the line, the ticker: the same capabilities, running forever, pausing
 *  under the pointer.
 * ============================================================================
 */
export default function StatementBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const line = lineRef.current;
    if (!section || !line || reduced) return;

    const split = SplitText.create(line, { type: "words", aria: "auto" });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        split.words,
        { opacity: 0.14, yPercent: 26 },
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.7,
          // One unit between words, stretched over however much scroll the
          // band happens to take: the sentence keeps its own rhythm.
          stagger: { each: 1, from: "start" },
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 76%",
            end: "bottom 70%",
            scrub: 0.5,
          },
        },
      );
    }, section);

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [reduced]);

  return (
    <section
      id="statement"
      ref={sectionRef}
      data-tune="sec-statement"
      className="relative z-10 overflow-hidden border-y border-bone/10 bg-ink-950 py-20 md:py-28"
      aria-labelledby="statement-title"
    >
      <div className="shell">
        <div className="flex items-center gap-5">
          <span className="eyebrow shrink-0">{statement.eyebrow}</span>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-bone/15 to-transparent" />
        </div>

        <h2 id="statement-title" className="sr-only">
          Statement
        </h2>

        {/* The whole line leans with the page's own speed — see VelocitySkew. */}
        <VelocitySkew className="mt-10" max={4.5}>
          <p
            ref={lineRef}
            data-tune="item-statement-line"
            className="max-w-[22ch] font-display text-[7.6vw] uppercase leading-[1.02] tracking-[0.01em] text-bone sm:max-w-[30ch] sm:text-[2.3rem] sm:leading-[1.06] lg:text-[2.9rem]"
          >
            {statement.line}
          </p>
        </VelocitySkew>

        <div className="mt-12 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4 border-t border-bone/10 pt-6">
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-muted">
            {statement.attribution}
          </span>
          <span className="max-w-[46ch] font-body text-sm leading-relaxed text-bone-dim">
            {statement.note}
          </span>
        </div>
      </div>

      {/* Full bleed, outside the shell: a ticker that stops at the margin reads
          as a box. It runs edge to edge and pauses under the pointer. */}
      <div data-tune="item-statement-ticker">
        <VelocitySkew className="mt-14 md:mt-16" max={3}>
          <Marquee
            items={statement.ticker}
            durationS={54}
            className="border-y border-bone/10 bg-ink-900/40 py-5"
          />
        </VelocitySkew>
      </div>
    </section>
  );
}
