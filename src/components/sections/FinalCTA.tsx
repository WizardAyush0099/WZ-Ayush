import { useEffect, useRef, useState } from "react";
import { assets, cta, footer } from "../../data/content";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { useCrowCue } from "../../lib/useCrowCue";
import { triggerCrows } from "../../lib/fx";
import { RevealText } from "../common/Reveal";

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const [hover, setHover] = useState(false);
  const reduced = usePrefersReducedMotion();
  useCrowCue(sectionRef, 18, "top 70%");

  // Red light that trails the cursor across the section.
  useEffect(() => {
    const section = sectionRef.current;
    const light = lightRef.current;
    if (!section || !light || reduced) return;

    const state = { x: window.innerWidth / 2, y: window.innerHeight / 2, tx: 0, ty: 0, inside: false };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      state.tx = e.clientX - rect.left;
      state.ty = e.clientY - rect.top;
      if (!state.inside) {
        state.x = state.tx;
        state.y = state.ty;
      }
      state.inside = true;
    };
    const onLeave = () => (state.inside = false);

    const loop = () => {
      state.x += (state.tx - state.x) * 0.12;
      state.y += (state.ty - state.y) * 0.12;
      light.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  // Background drifts slowly against the copy.
  useEffect(() => {
    const img = bgRef.current;
    if (!img || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        img,
        { yPercent: -8, scale: 1.08 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 0.7 },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative z-10 flex min-h-[92svh] items-center overflow-hidden bg-ink-950"
      aria-labelledby="cta-title"
    >
      <img
        ref={bgRef}
        src={assets.cta}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        style={{ willChange: "transform" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/60 to-ink-950" />

      {/* Cursor-following red light */}
      <div
        ref={lightRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[46rem] w-[46rem] rounded-full blur-[90px] transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle, rgba(214,31,38,0.30), transparent 65%)",
          opacity: hover ? 1 : 0.35,
        }}
      />

      <div className="shell relative z-10 py-24 text-center">
        <RevealText stagger className="flex flex-col items-center gap-7">
          <span className="eyebrow">{cta.eyebrow}</span>
          <h2 id="cta-title" className="display text-[15vw] leading-[0.9] text-bone sm:text-[10vw] lg:text-[8rem]">
            {cta.title}
          </h2>
          <span className="font-jp text-sm tracking-[0.5em] text-blood-500/70">{cta.kanji}</span>
          <p className="max-w-[42ch] font-body text-base leading-relaxed text-bone-muted">{cta.body}</p>
        </RevealText>

        <div className="mt-12 flex justify-center">
          <a
            href={`mailto:${footer.email}`}
            data-cursor="hover"
            onMouseEnter={() => {
              setHover(true);
              if (!reduced) triggerCrows(10);
            }}
            onMouseLeave={() => setHover(false)}
            className="group relative inline-flex items-center gap-4 overflow-hidden border border-bone/25 px-10 py-5 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-all duration-500 ease-silk hover:border-blood-500/80 hover:px-14"
          >
            <span
              className="absolute inset-0 -z-10 origin-left scale-x-0 bg-blood-700/40 transition-transform duration-700 ease-silk group-hover:scale-x-100"
              aria-hidden="true"
            />
            {cta.action}
            <span className="transition-transform duration-500 ease-silk group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
