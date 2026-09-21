import { useEffect, useRef } from "react";
import { story } from "../../data/content";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { useCrowCue } from "../../lib/useCrowCue";
import { RevealImage, RevealText } from "../common/Reveal";

export default function StorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useCrowCue(sectionRef, 10, "top 65%");

  // Gentle counter-parallax so the still drifts against the copy.
  useEffect(() => {
    const image = imageRef.current;
    if (!image || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        image,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative z-10 bg-ink-950 py-28 md:py-40 lg:py-48"
      aria-labelledby="story-title"
    >
      <div className="shell">
        <div className="grid items-center gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
          {/* Copy */}
          <div className="order-2 md:order-1 md:col-span-6 lg:col-span-5">
            <RevealText stagger className="flex flex-col gap-6">
              <span className="eyebrow">{story.eyebrow}</span>
              <h2 id="story-title" className="display text-[11vw] leading-[0.92] sm:text-5xl lg:text-6xl">
                {story.title}
              </h2>
              <span className="font-jp text-sm tracking-[0.45em] text-blood-500/70">{story.kanji}</span>
              {story.body.map((p) => (
                <p key={p.slice(0, 18)} className="max-w-[46ch] font-body text-base leading-relaxed text-bone-muted">
                  {p}
                </p>
              ))}
            </RevealText>

            <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-bone/10 pt-8">
              {story.stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <dt className="font-display text-2xl text-bone sm:text-3xl">{s.value}</dt>
                  <dd className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2 md:col-span-6 md:col-start-7 lg:col-span-7">
            <div ref={imageRef}>
              <RevealImage
                src={story.image}
                alt="A crimson moon above a dark ridge"
                variant="mask"
                className="aspect-[4/5] w-full sm:aspect-[3/4] md:aspect-[4/5]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
