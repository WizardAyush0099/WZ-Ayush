import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { assets, hero as heroContent } from "../../data/content";
import { useIsTouch, usePrefersReducedMotion } from "../../lib/hooks";
import { scrollToId } from "../../lib/scroll";
import { triggerCrows } from "../../lib/fx";
import Sharingan from "./Sharingan";
import FogCanvas from "../fx/FogCanvas";

export default function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInnerRef = useRef<HTMLSpanElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const sharinganRef = useRef<HTMLDivElement>(null);
  const figureWrapRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLImageElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const eyesScrollRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);
  const smokeRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);

  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouch();

  /* ------------------------------------------------------------------ *
   * 1. Pointer / gyro / touch parallax — different depths per layer
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    // `z` places each layer on a real 3D plane inside the stage's perspective,
    // so far layers shrink and drift less while near layers sweep past — the
    // parallax then reads as depth rather than flat offsets.
    const rawLayers: Array<{ el: HTMLElement | null; depth: number; z: number }> = [
      { el: bgRef.current, depth: 6, z: -90 },
      { el: glowRef.current, depth: 14, z: -70 },
      { el: titleRef.current, depth: 16, z: -60 },
      { el: shadowRef.current, depth: 22, z: -45 },
      { el: sharinganRef.current, depth: 30, z: -35 },
      { el: figureWrapRef.current, depth: 40, z: 0 },
      { el: orbsRef.current, depth: 64, z: 40 },
      { el: smokeRef.current, depth: 48, z: 25 },
      { el: copyRef.current, depth: 10, z: 0 },
    ];
    const layers = rawLayers.filter(
      (l): l is { el: HTMLElement; depth: number; z: number } => l.el !== null,
    );

    layers.forEach((l) => gsap.set(l.el, { z: l.z }));

    const movers = layers.map((l) => ({
      depth: l.depth,
      x: gsap.quickTo(l.el, "x", { duration: 1.1, ease: "power3.out" }),
      y: gsap.quickTo(l.el, "y", { duration: 1.1, ease: "power3.out" }),
    }));

    const sharinganEl = sharinganRef.current;
    const opacityTo = sharinganEl
      ? gsap.quickTo(sharinganEl, "opacity", { duration: 0.8, ease: "power2.out" })
      : null;
    const eyesTo = eyesRef.current
      ? gsap.quickTo(eyesRef.current, "opacity", { duration: 0.8, ease: "power2.out" })
      : null;

    let rect = sharinganEl ? sharinganEl.getBoundingClientRect() : null;
    const measure = () => {
      rect = sharinganEl ? sharinganEl.getBoundingClientRect() : null;
    };

    const apply = (nx: number, ny: number) => {
      movers.forEach((m) => {
        m.x(nx * m.depth);
        m.y(ny * m.depth);
      });

      if (rect && opacityTo) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const px = nx * (window.innerWidth / 2) + window.innerWidth / 2;
        const py = ny * (window.innerHeight / 2) + window.innerHeight / 2;
        const dist = Math.hypot(px - cx, py - cy);
        const reach = Math.max(rect.width, 320) * 1.35;
        const intensity = Math.max(0, 1 - dist / reach);
        opacityTo(0.18 + intensity * 0.62);
        eyesTo?.(0.25 + intensity * 0.6);
      }
    };

    const onMouse = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      apply(nx, ny);
    };

    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const nx = (t.clientX / window.innerWidth - 0.5) * 2;
      const ny = (t.clientY / window.innerHeight - 0.5) * 2;
      apply(nx * 0.45, ny * 0.45);
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // left-right [-90,90]
      const beta = e.beta ?? 0; // front-back [-180,180]
      apply(Math.max(-1, Math.min(1, gamma / 45)) * 0.5, Math.max(-1, Math.min(1, (beta - 45) / 45)) * 0.5);
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("resize", measure);
    if (isTouch) window.addEventListener("deviceorientation", onOrientation);

    const onScroll = () => (rect = sharinganEl ? sharinganEl.getBoundingClientRect() : null);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
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
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.7,
        },
        defaults: { ease: "none" },
      });

      tl.to(figureRef.current, { scale: 1.28, yPercent: -5 }, 0)
        .to(figureWrapRef.current, { xPercent: 3 }, 0)
        .to(shadowRef.current, { scale: 1.18, opacity: 0.2 }, 0)
        .to(titleRef.current, { yPercent: -46, opacity: 0.06 }, 0)
        .to(copyRef.current, { yPercent: -30, opacity: 0 }, 0)
        .to(hintRef.current, { opacity: 0 }, 0)
        .to(sharinganRef.current, { scale: 1.15, opacity: 0.65 }, 0)
        .to(eyesScrollRef.current, { opacity: 0.85 }, 0)
        .to(darkRef.current, { opacity: 0.82 }, 0)
        .to(smokeRef.current, { xPercent: 22, opacity: 0.55 }, 0)
        .to(orbsRef.current, { yPercent: -18, opacity: 0.4 }, 0);

      // Brief Mangekyo "activation" pulse the first time the hero is left.
      ScrollTrigger.create({
        trigger: section,
        start: "35% top",
        onEnter: () => {
          triggerCrows(isTouch ? 8 : 16);
          if (eyesScrollRef.current) {
            gsap.fromTo(
              eyesScrollRef.current,
              { opacity: 0.3 },
              { opacity: 1, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.inOut" },
            );
          }
        },
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
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(figureRef.current, { y: 48, opacity: 0, duration: 1.4 }, 0)
        .from(titleInnerRef.current, { y: 70, duration: 1.3 }, 0.05)
        .from(
          copyRef.current ? Array.from(copyRef.current.children) : [],
          { y: 28, opacity: 0, duration: 0.9, stagger: 0.12 },
          0.35,
        )
        .from(hintRef.current, { y: 24, opacity: 0, duration: 0.9 }, 0.8)
        .from(sharinganRef.current, { opacity: 0, duration: 1.6 }, 0.2);
    }, sectionRef);
    return () => ctx.revert();
  }, [ready, reduced]);

  const goDown = () => scrollToId("story");

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden"
      aria-label="Hero"
    >
      {/*
        3D stage — every atmospheric layer shares one perspective, so the
        pointer parallax produces genuine depth (near layers sweep, far ones
        barely move) instead of flat 2D offsets.
      */}
      <div
        ref={stageRef}
        className="absolute inset-0 z-0"
        style={{ perspective: "1200px", perspectiveOrigin: "55% 45%" }}
      >
      {/* 1 — background atmosphere */}
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

      {/* 1b — volumetric haze / lit smoke */}
      <FogCanvas className="z-[3] opacity-90" />

      {/* 2 — giant hollow wordmark behind the figure */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute inset-x-0 top-[22%] z-10 text-center sm:top-[24%]"
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

      {/* 3 — blurred silhouette */}
      <div ref={shadowRef} className="absolute bottom-[-4%] right-[-4%] z-[6] w-[86%] max-w-[900px] opacity-55 sm:w-[70%]">
        <img
          src={assets.heroShadow}
          alt=""
          aria-hidden="true"
          className="h-auto w-full object-contain"
          style={{ filter: "blur(2px)" }}
          decoding="async"
        />
      </div>

      {/* 4 — Sharingan behind the character */}
      <div
        ref={sharinganRef}
        className="absolute right-[-14%] z-[8] aspect-square w-[82vmin] opacity-[0.18] sm:right-[2%] sm:w-[54vmin] sm:max-w-[560px]"
        style={{ bottom: "12%", willChange: "transform, opacity" }}
        aria-hidden="true"
      >
        <Sharingan />
      </div>

      {/* 5 — main figure + Mangekyo eye light */}
      <div className="absolute bottom-0 right-[-6%] z-20 h-[74%] w-[98%] sm:right-[2%] sm:h-[94%] sm:w-[58%] sm:max-w-[720px]">
        <div ref={figureWrapRef} className="relative h-full w-full" style={{ willChange: "transform" }}>
          <img
            ref={figureRef}
            src={assets.heroFigure}
            alt="Hero figure cloaked in shadow with a faint red rim light"
            className="h-full w-full object-contain object-bottom"
            fetchPriority="high"
            decoding="async"
            style={{ willChange: "transform, opacity" }}
          />
          {/* Mangekyo gradient positioned over the head region of the figure.
              Two stacked layers: one reacts to the pointer, one to scroll. */}
          <div
            ref={eyesRef}
            className="pointer-events-none absolute left-[37%] top-[17%] h-[9%] w-[26%] opacity-25 mix-blend-screen"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,180,180,0.95), rgba(224,23,28,0.6) 42%, transparent 75%)",
              filter: "blur(7px)",
            }}
            aria-hidden="true"
          />
          <div
            ref={eyesScrollRef}
            className="pointer-events-none absolute left-[35%] top-[15%] h-[13%] w-[30%] opacity-0 mix-blend-screen"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,120,120,0.9), rgba(214,31,38,0.5) 45%, transparent 78%)",
              filter: "blur(12px)",
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* 6 — foreground orbs (fast parallax) */}
      <div ref={orbsRef} className="pointer-events-none absolute inset-0 z-[24]" aria-hidden="true" style={{ willChange: "transform" }}>
        <div
          className="absolute left-[8%] top-[62%] h-24 w-24 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(214,31,38,0.5), transparent 70%)" }}
        />
        <div
          className="absolute right-[16%] top-[22%] h-16 w-16 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(214,31,38,0.4), transparent 70%)" }}
        />
        <div
          className="absolute left-[38%] bottom-[14%] h-28 w-28 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(140,11,16,0.45), transparent 70%)" }}
        />
      </div>

      {/* 7 — smoke band that sweeps in on scroll */}
      <div ref={smokeRef} className="pointer-events-none absolute inset-0 z-[26] opacity-0" aria-hidden="true" style={{ willChange: "transform, opacity" }}>
        <div
          className="absolute inset-x-[-30%] top-[40%] h-[45%] blur-[60px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(120,100,100,0.22) 40%, rgba(160,140,140,0.16) 55%, transparent)",
          }}
        />
      </div>
      </div>

      {/* 8 — copy */}
      <div className="shell absolute inset-x-0 bottom-[14%] z-30 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
        <div ref={copyRef} className="max-w-[560px]">
          <p className="eyebrow mb-5 opacity-90">{heroContent.traits}</p>
          <p className="display text-[9vw] leading-[0.95] text-bone sm:text-5xl lg:text-[3.6rem]">
            {heroContent.tagline}
          </p>
          <p className="mt-5 max-w-[380px] font-body text-sm leading-relaxed text-bone-muted sm:mt-7 sm:text-base">
            An interactive film sequence disguised as a website — motion, depth and shadow in service of the story.
          </p>
          <div className="mt-8 hidden items-center gap-4 sm:flex">
            <button
              type="button"
              onClick={goDown}
              className="btn"
              data-cursor="hover"
            >
              Enter the Story
            </button>
            <span className="font-accent text-sm tracking-[0.4em] text-blood-500/70">{heroContent.accent}</span>
          </div>
        </div>
        {/* Screen-reader heading keeps semantics intact */}
        <h1 className="sr-only">
          {heroContent.title} — {heroContent.tagline}
        </h1>
      </div>

      {/* 9 — darkening overlay for the scroll transition */}
      <div ref={darkRef} className="pointer-events-none absolute inset-0 z-[34] bg-ink-950 opacity-0" aria-hidden="true" />

      {/* 10 — scroll hint */}
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
