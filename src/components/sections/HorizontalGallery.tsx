import { useEffect, useRef } from "react";
import { templates } from "../../data/templates";
import { linkTo } from "../../lib/router";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { useStudio } from "../../lib/siteData";
import LivePreviewFrame from "../media/LivePreviewFrame";
import SplitReveal from "../fx/SplitReveal";
import TiltCard from "../fx/TiltCard";

/**
 * ============================================================================
 *  TEMPLATES ON THE HOMEPAGE — the pinned, sideways shelf
 * ============================================================================
 *  This is the section that used to be "Art Direction — The Reel". It keeps
 *  the mechanic the page is built on: the section pins, and scrolling moves
 *  the six template blocks through the frame one after another — the pages
 *  change with scroll, then release the page when the sixth is reached.
 *
 *  What the blocks hold are the six real templates, each one the shipped HTML
 *  site running live inside its frame, laid out at desktop width and scaled to
 *  the block (see `LivePreviewFrame`). Sized this way, the whole design is on
 *  screen instead of a narrow slice of it, and the frame is inert, so the page
 *  keeps ownership of scroll and clicks; tapping a block opens the template
 *  full size on /#/template/<id>.
 *
 *  Hover lands on each block as a chromatic sweep (the `sheen` class): a thin
 *  red/cyan light travelling across the frame. Deliberately a class and not a
 *  pointer-tracked effect — the block is covered by an iframe, so the parent
 *  document never sees the pointer's coordinates over it, and a spotlight that
 *  only works between the frames would be worse than none.
 * ============================================================================
 */

/**
 * Frame heights/widths cycle so the shelf keeps its rhythm. These are much
 * larger than they were: a block has to be big enough for the scaled desktop
 * layout to be read, and small blocks were the whole complaint.
 *
 * Heights are set so each size plus its own vertical offset still lands inside
 * the stage: the blocks are centred in the row first and then shifted, so `h`
 * plus `offset` has to stay within 100%, or the tallest blocks would ride over
 * the progress rail underneath.
 */
const SIZE_CLASSES: Record<string, string> = {
  lg: "h-[84%] w-[88vw] sm:w-[72vw] lg:w-[54vw]",
  md: "h-[76%] w-[80vw] sm:w-[64vw] lg:w-[46vw]",
  sm: "h-[68%] w-[72vw] sm:w-[56vw] lg:w-[38vw]",
};

const OFFSETS: Record<string, string> = {
  sm: "-translate-y-[8%]",
  md: "translate-y-0",
  lg: "translate-y-[8%]",
};

const SCALES = ["lg", "md", "sm", "lg", "md", "sm"] as const;

export default function HorizontalGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  /** The shelf's own feel — scrub and reveal strength — from the Studio tab. */
  const { motion } = useStudio();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || reduced) return;

    const ctx = gsap.context(() => {
      const amount = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -amount(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${amount() + window.innerHeight * 0.4}`,
          pin: true,
          scrub: motion.shelfScrub > 0 ? motion.shelfScrub : true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      // Reveal each block as it slides into frame (horizontal containerAnimation).
      // The strength is the owner's: at 0 the blocks simply arrive, at 1 they
      // come up from a quarter opacity, which is the committed feel.
      gsap.utils.toArray<HTMLElement>("[data-reel-item]").forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 1 - 0.75 * motion.shelfReveal, scale: 1 - 0.05 * motion.shelfReveal },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              containerAnimation: tween,
              start: "left 92%",
              end: "left 52%",
              scrub: true,
            },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, [reduced, motion.shelfScrub, motion.shelfReveal]);

  return (
    <section
      id="templates"
      ref={sectionRef}
      data-tune="sec-templates"
      className="relative z-10 flex h-[100svh] min-h-[560px] flex-col justify-center overflow-hidden bg-ink-900"
      aria-label="Template showcase"
    >
      <div data-tune="item-templates-head" className="shell mb-8 flex items-end justify-between gap-6">
        <div>
          <span className="eyebrow">Art Direction</span>
          <SplitReveal
            as="h2"
            text="The Starting Points"
            type="words"
            className="display mt-3 text-3xl text-bone sm:text-4xl lg:text-5xl"
          />
        </div>
        <p className="hidden max-w-[36ch] font-body text-sm text-bone-dim sm:block">
          Six complete sites, each running live in its frame — scroll through them, then tap
          any block to open it full size.
        </p>
      </div>

      {/* Definite-height viewport so the block heights resolve. */}
      <div
        className={`relative h-[66svh] min-h-[340px] max-h-[680px] ${
          reduced ? "overflow-x-auto pb-4 [scrollbar-width:none]" : ""
        }`}
      >
        <div
          ref={trackRef}
          data-tune="item-templates-shelf"
          className="flex h-full w-max items-center gap-6 px-6 sm:gap-10 sm:px-8 lg:px-14"
          style={{ willChange: "transform" }}
        >
          {templates.map((template, i) => {
            const scale = SCALES[i % SCALES.length];
            const index = String(i + 1).padStart(2, "0");
            return (
              <figure
                key={template.id}
                data-reel-item
                className={`group flex shrink-0 flex-col ${SIZE_CLASSES[scale]} ${OFFSETS[scale]}`}
              >
                {/* Each frame leans towards the pointer — the shelf reads as
                    objects laid out on a table rather than as a strip of images. */}
                <TiltCard
                  max={4}
                  depth={0}
                  className="sheen relative flex min-h-0 flex-1 flex-col overflow-hidden border border-bone/10 bg-ink-950 transition-colors duration-700 hover:border-blood-500/40"
                >
                  {/* Browser chrome */}
                  <div className="flex shrink-0 items-center gap-2 border-b border-bone/10 bg-ink-900/90 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-bone/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-bone/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-bone/20" />
                    <span className="mx-auto truncate font-body text-[9px] uppercase tracking-wide2 text-bone-dim">
                      {template.category}
                    </span>
                  </div>

                  {/* The live site itself — inert, so the shelf keeps the scroll. */}
                  <div className="relative min-h-0 flex-1">
                    <LivePreviewFrame
                      src={template.href}
                      title={`${template.name} — live template preview`}
                      className="absolute inset-0"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                    <a
                      href={linkTo(`/template/${template.id}`)}
                      data-sfx="open"
                      className="absolute inset-0 z-10 flex items-end justify-center pb-5 opacity-0 transition-opacity duration-500 focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={`Open the ${template.name} template full size`}
                    >
                      <span className="border border-bone/30 bg-ink-950/85 px-4 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone backdrop-blur-sm">
                        Open {template.name} ↗
                      </span>
                    </a>
                  </div>
                </TiltCard>

                <figcaption className="mt-3 flex shrink-0 items-baseline justify-between font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  <span className="text-blood-500/70">{index}</span>
                  <span className="text-bone-muted transition-colors duration-500 group-hover:text-bone">
                    {template.name}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      {/* Progress rail (non-pinned fallback keeps it static) */}
      <div className="shell mt-10">
        <div className="h-px w-full bg-bone/10">
          <div
            ref={progressRef}
            className="h-px origin-left bg-blood-500"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </section>
  );
}
