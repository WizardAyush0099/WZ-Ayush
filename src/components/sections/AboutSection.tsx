import { useEffect, useRef } from "react";
import { about, assets } from "../../data/content";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { RevealImage, RevealText } from "../common/Reveal";

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const word = wordRef.current;
    if (!word || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        word,
        { yPercent: 14 },
        {
          yPercent: -14,
          ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 0.7 },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-ink-950 py-28 md:py-40 lg:py-48"
      aria-labelledby="about-title"
    >
      <div className="shell">
        <div className="grid gap-14 md:grid-cols-12 md:gap-10">
          {/* Portrait with layered typography */}
          <div className="relative md:col-span-5">
            <span
              ref={wordRef}
              aria-hidden="true"
              className="display text-hollow pointer-events-none absolute -left-6 top-[8%] z-0 select-none text-[34vw] leading-none opacity-70 md:-left-10 md:text-[15rem]"
            >
              {about.kanji}
            </span>
            <div className="relative z-10">
              <RevealImage
                src={assets.portrait}
                alt="Portrait of Itachi Uchiha lit by a low red glow"
                variant="mask"
                className="aspect-[4/5] w-full"
              />
            </div>
            <div className="relative z-10 mt-5 flex items-center gap-3 font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              <span className="h-px w-8 bg-blood-500/60" />
              <span>Portrait — placeholder, swap anytime</span>
            </div>
          </div>

          {/* Copy */}
          <div className="md:col-span-6 md:col-start-7 md:self-center">
            <RevealText stagger className="flex flex-col gap-6">
              <span className="eyebrow">{about.eyebrow}</span>
              <h2 id="about-title" className="display text-[11vw] leading-[0.95] sm:text-5xl lg:text-[3.4rem]">
                {about.title}
              </h2>
              {about.body.map((p) => (
                <p key={p.slice(0, 16)} className="max-w-[52ch] font-body text-base leading-relaxed text-bone-muted">
                  {p}
                </p>
              ))}
            </RevealText>

            <dl className="mt-12 grid gap-px overflow-hidden border border-bone/10 sm:grid-cols-3">
              {about.facts.map((f) => (
                <div key={f.label} className="bg-ink-900/60 p-5">
                  <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">{f.label}</dt>
                  <dd className="mt-2 font-display text-lg text-bone">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
