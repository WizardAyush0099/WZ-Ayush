import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { hero as heroContent } from "../../data/content";
import { useIsTouch, usePrefersReducedMotion } from "../../lib/hooks";
import { scrollToId } from "../../lib/scroll";
import { triggerCrows } from "../../lib/fx";
import NinjaScene from "./NinjaScene";
import FogCanvas from "../fx/FogCanvas";

/**
 * ============================================================================
 *  HERO — a 3D stage
 * ============================================================================
 *  Every atmospheric layer shares one perspective, so pointer parallax reads
 *  as real depth: far layers barely move, near layers sweep past. The
 *  centrepiece is a live WebGL scene (`NinjaScene`) rather than a flat image.
 * ============================================================================
 */
export default function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInnerRef = useRef<HTMLSpanElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const sceneInnerRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);
  const smokeRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);

  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouch();

  /* ------------------------------------------------------------------ *
   * 1. Pointer / gyro parallax — a different depth per layer
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    // `z` places each layer on a real 3D plane inside the stage's perspective.
    const rawLayers: Array<{ el: HTMLElement | null; depth: number; z: number }> = [
      { el: bgRef.current, depth: 6, z: -90 },
      { el: glowRef.current, depth: 14, z: -70 },
      { el: titleRef.current, depth: 16, z: -60 },
      { el: shadowRef.current, depth: 22, z: -45 },
      { el: sceneInnerRef.current, depth: 26, z: -20 },
      { el: orbsRef.current, depth: 64, z: 40 },
      { el: smokeRef.current, depth: 48, z: 25 },
      { el: copyRef.current, depth: 10, z: 0 },
    ];
    const layers = rawLayers.filter(
      (l): l is { el: HTMLElement; depth: number; z: number } => l.el !== null,
    );

    layers.forEach((l) => gsap.set(l.el, { z: l.z, transformPerspective: 1200 }));

    const movers = layers.map((l) => ({
      depth: l.depth,
      x: gsap.quickTo(l.el, "x", { duration: 1.1, ease: "power3.out" }),
      y: gsap.quickTo(l.el, "y", { duration: 1.1, ease: "power3.out" }),
      rx: gsap.quickTo(l.el, "rotationY", { duration: 1.3, ease: "power3.out" }),
    }));

    const apply = (nx: number, ny: number) => {
      movers.forEach((m) => {
        m.x(nx * m.depth);
        m.y(ny * m.depth);
        m.rx(nx * m.depth * 0.18);
      });
    };

    const onMouse = (e: MouseEvent) => {
      apply(
        (e.clientX / window.innerWidth - 0.5) * 2,
        (e.clientY / window.innerHeight - 0.5) * 2,
      );
    };

    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      apply((t.clientX / window.innerWidth - 0.5) * 0.9, (t.clientY / window.innerHeight - 0.5) * 0.9);
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      apply(
        Math.max(-1, Math.min(1, gamma / 45)) * 0.5,
        Math.max(-1, Math.min(1, (beta - 45) / 45)) * 0.5,
      );
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    if (isTouch) window.addEventListener("deviceorientation", onOrientation);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [reduced, isTouch]);

  /* ------------------------------------------------------------------ *
   * 2. Scroll-driven cinematic transition (scrubbed, reversible)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.7 },
        defaults: { ease: "none" },
      });

      tl.to(sceneInnerRef.current, { scale: 1.34, yPercent: -4, opacity: 0.35 }, 0)
        .to(shadowRef.current, { scale: 1.18, opacity: 0.15 }, 0)
        .to(titleRef.current, { yPercent: -46, opacity: 0.05 }, 0)
        .to(copyRef.current, { yPercent: -26, opacity: 0 }, 0)
        .to(hintRef.current, { opacity: 0 }, 0)
        .to(darkRef.current, { opacity: 0.86 }, 0)
        .to(smokeRef.current, { xPercent: 22, opacity: 0.55 }, 0)
        .to(orbsRef.current, { yPercent: -18, opacity: 0.35 }, 0);

      // A single crow burst the first time the hero is left behind.
      ScrollTrigger.create({
        trigger: section,
        start: "35% top",
        onEnter: () => triggerCrows(isTouch ? 8 : 16),
      });
    }, section);

    return () => ctx.revert();
  }, [reduced, isTouch]);

  /* ------------------------------------------------------------------ *
   * 3. Intro reveal once the preloader hands over
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!ready || reduced) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(sceneRef.current, { opacity: 0, duration: 1.8 }, 0)
        .from(titleInnerRef.current, { y: 90, opacity: 0, duration: 1.4 }, 0.05)
        .from(
          copyRef.current ? Array.from(copyRef.current.children) : [],
          { y: 30, opacity: 0, duration: 1, stagger: 0.12 },
          0.35,
        )
        .from(hintRef.current, { y: 24, opacity: 0, duration: 0.9 }, 0.85);
    }, sectionRef);
    return () => ctx.revert();
  }, [ready, reduced]);

  const goDown = () => scrollToId("story");

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate h-[100svh] min-h-[660px] w-full overflow-hidden"
      aria-label="Hero"
    >
      {/* One perspective for every layer — that is what makes the depth real. */}
      <div className="absolute inset-0 z-0" style={{ perspective: "1200px", perspectiveOrigin: "55% 45%" }}>
        {/* 1 — atmosphere */}
        <div
          ref={bgRef}
          className="absolute inset-[-6%] z-0"
          style={{
            background:
              "radial-gradient(115% 85% at 72% 26%, rgba(94,7,11,0.55) 0%, rgba(35,3,5,0.35) 38%, transparent 70%), radial-gradient(90% 70% at 18% 82%, rgba(58,4,7,0.5) 0%, transparent 65%), #050304",
            willChange: "transform",
          }}
        />
        <div
          ref={glowRef}
          className="absolute -left-[12%] top-[-14%] z-0 h-[62%] w-[62%] rounded-full opacity-40 blur-[110px]"
          style={{ background: "radial-gradient(circle, rgba(140,11,16,0.6), transparent 70%)", willChange: "transform" }}
          aria-hidden="true"
        />

        {/* 1b — volumetric haze */}
        <FogCanvas className="z-[3] opacity-90" />

        {/* 2 — giant hollow wordmark behind everything */}
        <div
          ref={titleRef}
          className="pointer-events-none absolute inset-x-0 top-[19%] z-10 text-center sm:top-[21%]"
          style={{ willChange: "transform, opacity" }}
          aria-hidden="true"
        >
          <span
            ref={titleInnerRef}
            className="display text-hollow block text-[27vw] leading-none sm:text-[20vw] lg:text-[16vw]"
          >
            {heroContent.title}
          </span>
        </div>

        {/* 3 — blurred silhouette for grounding */}
        <div ref={shadowRef} className="absolute bottom-[-4%] right-[-6%] z-[6] w-[96%] max-w-[1000px] opacity-30 sm:w-[78%]">
          <img
            src={`${import.meta.env.BASE_URL}assets/hero-shadow.svg`}
            alt=""
            aria-hidden="true"
            className="h-auto w-full object-contain"
            style={{ filter: "blur(8px)" }}
            decoding="async"
          />
        </div>

        {/* 4 — the live 3D stage */}
        <div
          ref={sceneRef}
          className="absolute inset-y-0 left-1/2 z-[12] w-[190vw] -translate-x-1/2 opacity-70 sm:left-auto sm:right-[-6%] sm:w-[74%] sm:translate-x-0 sm:opacity-100 lg:right-[2%] lg:w-[62%]"
        >
          <div ref={sceneInnerRef} className="h-full w-full" style={{ willChange: "transform" }}>
            <NinjaScene className="h-full w-full" />
          </div>
        </div>

        {/* 5 — foreground orbs (fast parallax) */}
        <div ref={orbsRef} className="pointer-events-none absolute inset-0 z-[24]" aria-hidden="true" style={{ willChange: "transform" }}>
          <div className="absolute left-[8%] top-[62%] h-24 w-24 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(214,31,38,0.5), transparent 70%)" }} />
          <div className="absolute right-[16%] top-[22%] h-16 w-16 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(214,31,38,0.4), transparent 70%)" }} />
          <div className="absolute bottom-[14%] left-[38%] h-28 w-28 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(140,11,16,0.45), transparent 70%)" }} />
        </div>

        {/* 6 — smoke band that sweeps in on scroll */}
        <div ref={smokeRef} className="pointer-events-none absolute inset-0 z-[26] opacity-0" aria-hidden="true" style={{ willChange: "transform, opacity" }}>
          <div
            className="absolute inset-x-[-30%] top-[40%] h-[45%] blur-[60px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(120,100,100,0.22) 40%, rgba(160,140,140,0.16) 55%, transparent)" }}
          />
        </div>
      </div>

      {/* 7 — copy */}
      <div className="shell absolute inset-x-0 bottom-[13%] z-30 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
        <div ref={copyRef} className="max-w-[600px]">
          <p className="mb-6 inline-flex items-center gap-3 border border-bone/10 bg-ink-950/40 px-4 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blood-500" />
            </span>
            Available for work
          </p>
          <p className="eyebrow mb-5 opacity-90">{heroContent.traits}</p>
          <p className="display text-[10vw] leading-[0.92] text-bone sm:text-[3.4rem] lg:text-[4rem]">
            {heroContent.tagline}
          </p>
          <p className="mt-6 max-w-[440px] font-body text-sm leading-relaxed text-bone-muted sm:text-base">
            {heroContent.lede}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" onClick={goDown} className="btn" data-cursor="hover">
              Enter the Story
            </button>
            <a
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("work");
              }}
              data-cursor="hover"
              className="group inline-flex items-center gap-2 border border-transparent px-2 py-4 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-500 ease-silk hover:text-bone"
            >
              See the Work
              <span aria-hidden="true" className="transition-transform duration-500 ease-silk group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>
        {/* Keeps the document outline intact */}
        <h1 className="sr-only">
          {heroContent.title} — {heroContent.tagline}
        </h1>
      </div>

      {/* 8 — darkening overlay for the scroll transition */}
      <div ref={darkRef} className="pointer-events-none absolute inset-0 z-[34] bg-ink-950 opacity-0" aria-hidden="true" />

      {/* 9 — scroll hint */}
      <div ref={hintRef} className="absolute inset-x-0 bottom-7 z-40 flex justify-center sm:bottom-9">
        <button
          type="button"
          onClick={goDown}
          data-cursor="hover"
          className="group flex flex-col items-center gap-3"
          aria-label="Scroll to explore"
        >
          <span className="font-body text-[10px] uppercase tracking-cinematic text-bone-dim transition-colors group-hover:text-bone">
            {heroContent.scrollHint}
          </span>
          <span className="relative block h-10 w-px overflow-hidden bg-bone/15">
            <span className="absolute inset-x-0 top-0 h-4 animate-scroll-pulse bg-blood-500" />
          </span>
        </button>
      </div>
    </section>
  );
}
