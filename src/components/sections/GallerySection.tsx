import { useEffect, useMemo, useRef } from "react";
import { gallery, type GalleryFrame } from "../../data/content";
import { useStoredImages } from "../../lib/imageStore";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { RevealImage, RevealText } from "../common/Reveal";
import { useLightbox } from "../common/Lightbox";

const SPANS = [
  "col-span-12 sm:col-span-7",
  "col-span-12 sm:col-span-5 sm:mt-[14%]",
  "col-span-12 sm:col-span-4 sm:-mt-[6%]",
  "col-span-12 sm:col-span-8",
  "col-span-12 sm:col-span-5 sm:mt-[10%]",
  "col-span-12 sm:col-span-7",
];

const RATIOS: Record<string, string> = {
  tall: "aspect-[3/4]",
  wide: "aspect-[16/10]",
  square: "aspect-square",
};

const SPEEDS = [5, -4, 7, -6, 4, -7, 6, -5];

/** Cycle the layout hints so any number of uploads keeps the collage rhythm. */
function spanFor(index: number): GalleryFrame["span"] {
  return (["wide", "tall", "square"] as const)[index % 3];
}

export default function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = usePrefersReducedMotion();
  const { open } = useLightbox();
  const { images } = useStoredImages();

  /**
   * Images added from the dashboard render first — the site visibly changes
   * the moment something is uploaded.
   */
  const frames = useMemo<GalleryFrame[]>(() => {
    const uploaded = images.map((image, i) => ({
      src: image.dataUrl,
      alt: image.caption,
      caption: image.caption,
      span: spanFor(i),
      rotate: ((i % 5) - 2) * 0.7,
    }));
    return [...uploaded, ...gallery];
  }, [images]);

  const items = frames.map((f) => ({ src: f.src, alt: f.alt, caption: f.caption }));

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const speed = SPEEDS[i % SPEEDS.length];
        gsap.fromTo(
          el,
          { yPercent: -speed },
          {
            yPercent: speed,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        );
      });
    }, sectionRef);
    return () => ctx.revert();
    // `frames.length` re-runs the parallax when uploads change the grid.
  }, [reduced, frames.length]);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-ink-950 py-24 md:py-32 lg:py-40"
      aria-labelledby="gallery-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">Gallery</span>
          <h2 id="gallery-title" className="display text-[12vw] leading-[0.9] sm:text-6xl lg:text-7xl">
            The Archive
          </h2>
          <p className="max-w-[48ch] font-body text-base text-bone-muted">
            Frames pulled from the sequence. Select any still to open it full-screen.
          </p>
        </RevealText>

        <div className="mt-16 grid grid-cols-12 gap-4 sm:gap-6 md:mt-24 md:gap-x-8 md:gap-y-16">
          {frames.map((frame, i) => (
            <div
              key={`${frame.caption}-${i}`}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={SPANS[i % SPANS.length]}
              style={{ willChange: "transform" }}
            >
              <div className="group" style={{ transform: `rotate(${frame.rotate}deg)` }}>
                <div className="relative">
                  <RevealImage
                    src={frame.src}
                    alt={frame.alt}
                    variant={i % 2 === 0 ? "mask" : "blur"}
                    className={`w-full ${RATIOS[frame.span]}`}
                    imgClassName="transition-transform duration-[1400ms] ease-silk group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => open(items, i)}
                    data-cursor="media"
                    data-cursor-label="View"
                    className="absolute inset-0 z-10"
                    aria-label={`Open ${frame.caption} full-screen`}
                  />
                  {i < images.length && (
                    <span className="pointer-events-none absolute left-3 top-3 z-20 border border-blood-600/60 bg-ink-950/80 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-blood-300 backdrop-blur-sm">
                      New
                    </span>
                  )}
                </div>
                <span className="mt-4 flex items-center justify-between font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  <span className="truncate transition-colors duration-500 group-hover:text-bone">
                    {frame.caption}
                  </span>
                  <span className="text-blood-500/70">{String(i + 1).padStart(2, "0")}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
