import { useEffect, useRef } from "react";
import { horizontal } from "../../data/content";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { useLightbox } from "../common/Lightbox";

const SIZE_CLASSES: Record<string, string> = {
  lg: "h-[62%] w-[74vw] sm:w-[46vw] lg:w-[34vw]",
  md: "h-[46%] w-[58vw] sm:w-[36vw] lg:w-[26vw]",
  sm: "h-[34%] w-[44vw] sm:w-[28vw] lg:w-[20vw]",
};

const OFFSETS: Record<string, string> = {
  sm: "-translate-y-[8%]",
  md: "translate-y-0",
  lg: "translate-y-[8%]",
};

export default function HorizontalGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { open } = useLightbox();

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
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      // Reveal each panel as it slides into frame (horizontal containerAnimation).
      gsap.utils.toArray<HTMLElement>("[data-reel-item]").forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0.25, scale: 0.95 },
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
  }, [reduced]);

  const items = horizontal.map((h) => ({ src: h.src, alt: h.alt, caption: `${h.index} · ${h.title}` }));

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex h-[100svh] min-h-[560px] flex-col justify-center overflow-hidden bg-ink-900"
      aria-label="Art direction reel"
    >
      <div className="shell mb-8 flex items-end justify-between gap-6">
        <div>
          <span className="eyebrow">Art Direction</span>
          <h2 className="display mt-3 text-3xl text-bone sm:text-4xl lg:text-5xl">The Reel</h2>
        </div>
        <p className="hidden max-w-[34ch] font-body text-sm text-bone-dim sm:block">
          Scroll to move the sequence — every frame placed by hand.
        </p>
      </div>

      {/* Definite-height viewport so the reel items' % heights resolve. */}
      <div
        className={`relative h-[56svh] min-h-[300px] max-h-[600px] ${
          reduced ? "overflow-x-auto pb-4 [scrollbar-width:none]" : ""
        }`}
      >
        <div
          ref={trackRef}
          className="flex h-full w-max items-center gap-6 px-6 sm:gap-10 sm:px-8 lg:px-14"
          style={{ willChange: "transform" }}
        >
          {horizontal.map((h) => (
            <figure
              key={h.index}
              data-reel-item
              className={`group flex shrink-0 flex-col ${SIZE_CLASSES[h.scale]} ${OFFSETS[h.scale]}`}
            >
              <button
                type="button"
                onClick={() => open(items, horizontal.indexOf(h))}
                data-cursor="media"
                data-cursor-label="Explore"
                className="relative block min-h-0 flex-1 overflow-hidden border border-bone/10"
                aria-label={`Open ${h.title} image`}
              >
                <img
                  src={h.src}
                  alt={h.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-[1.06]"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </button>
              <figcaption className="mt-3 flex shrink-0 items-baseline justify-between font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                <span className="text-blood-500/70">{h.index}</span>
                <span>{h.title}</span>
              </figcaption>
            </figure>
          ))}
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
