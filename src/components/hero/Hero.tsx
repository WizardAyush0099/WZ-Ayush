import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { hero as heroContent } from "../../data/content";
import { useIsPortrait, useIsTouch, usePrefersReducedMotion } from "../../lib/hooks";
import { scrollToId } from "../../lib/scroll";
import { useImageSlots, useSiteData, useStudio } from "../../lib/siteData";
import ScrollMedia from "../media/ScrollMedia";
import FogCanvas from "../fx/FogCanvas";

/**
 * ============================================================================
 *  HERO — the film, and nothing else
 * ============================================================================
 *  The centrepiece is the 300-frame cinematic run supplied in `Images.zip`
 *  (see `mediaDefaults` in src/data/content.ts). The section is deliberately
 *  tall — one screen of content spread over several screens of scroll — and
 *  the stage inside it is `sticky`, so the visitor scrubs through the whole
 *  sequence without the page appearing to move at all:
 *
 *    the frame sequence     canvas, one still per scroll step, held by
 *                           `ScrollMedia` (progress arrives as a ref, so a
 *                           300-frame scrub costs zero React renders)
 *    far plane              the hero artwork, blurred, sitting under the film
 *    mid plane              volumetric haze (`FogCanvas`)
 *    near plane             bokeh on its own z-plane, so pointer parallax
 *                           reads as real depth rather than everything
 *                           sliding together
 *
 *  NO TYPE SITS ON THE FOOTAGE — not at the start, not at the end. Every word
 *  the hero used to carry lives in the section directly below this one
 *  (`HeroIntro`), in normal document flow, so the last frame is as clean as
 *  the first. The only thing over the film is the scroll hint, and it is gone
 *  before the run finishes.
 *
 *  PORTRAIT — the film fills the screen. It used to be a band across the top
 *  with copy underneath, then a letterboxed strip with a blurred field around
 *  it; both left the picture smaller than the screen. It is now full-bleed, held
 *  still (no tilt, no drift, no push-in) and started just below the header so
 *  that bar can never cover any of it.
 *
 *  The film is also deliberately NOT one of the parallax planes: a tilted or
 *  drifting full-bleed frame pulls its own edge into view, which reads as a
 *  border around the picture. Depth now comes entirely from the planes behind
 *  and in front of it — the backdrop, the haze and the bokeh.
 *
 *  Every plane shares one perspective on the container, and a single scrubbed
 *  GSAP timeline dollies the film in. At the end of the run the stage fades to
 *  ink, so the pin releases into the (equally dark) intro section as a cut
 *  rather than a jolt.
 * ============================================================================
 */
export default function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);

  /** Scroll position through the pinned run, read by the frame scrubbing. */
  const progressRef = useRef(0);

  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouch();
  const portrait = useIsPortrait();
  const site = useSiteData();
  /**
   * How this film runs and how big its stage is — both owned by the dashboard's
   * Studio tab (#/admin → Studio → Motion), never by this file.
   */
  const studio = useStudio();
  const { motion, effects } = studio;

  /**
   * The backdrop plane is image slot 01 of the Hero section in the dashboard
   * (#/admin → Images), so its path, blur and opacity are editable without
   * touching this file. Switching the slot off falls back to the artwork path
   * on the Artwork tab. The plane's scroll choreography stays here: a backdrop
   * that the owner animates independently of the film is how a hero tears.
   */
  const heroSlots = useImageSlots("hero");
  const backdropSlot = heroSlots.find((slot) => slot.index === 1);
  const backdropSrc = backdropSlot?.src || site.assets.heroShadow;
  const backdropBlur = backdropSlot ? backdropSlot.blur : 22;
  const backdropOpacity = backdropSlot ? backdropSlot.opacity : 0.3;

  /**
   * Pinned only when the visitor is happy with motion. Reduced motion keeps a
   * single held frame and lets the copy below be read straight away.
   */
  const pinned = !reduced;

  /* ------------------------------------------------------------------ *
   * 1. Progress + the run's own progress rail
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      progressRef.current = progress;
      if (barRef.current) barRef.current.style.transform = `scaleY(${progress.toFixed(4)})`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reduced]);

  /* ------------------------------------------------------------------ *
   * 2. Pointer / gyro parallax — one depth per plane
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced || !motion.heroParallax) return;

    // `z` places each plane on a real 3D plane inside the stage's perspective.
    // The film is not among them — see the note at the top of this file. The
    // depth itself is the owner's (`Studio → Motion → Hero parallax`), so the
    // whole effect can be turned down or off without touching this file.
    const rawLayers: Array<{ el: HTMLElement | null; depth: number; z: number }> = [
      { el: backdropRef.current, depth: 5 * motion.heroParallax, z: -110 },
      { el: orbsRef.current, depth: 60 * motion.heroParallax, z: 60 },
    ];
    const layers = rawLayers.filter(
      (l): l is { el: HTMLElement; depth: number; z: number } => l.el !== null,
    );

    layers.forEach((l) => gsap.set(l.el, { z: l.z, transformPerspective: 1400 }));

    const movers = layers.map((l) => ({
      depth: l.depth,
      x: gsap.quickTo(l.el, "x", { duration: 1.1, ease: "power3.out" }),
      y: gsap.quickTo(l.el, "y", { duration: 1.1, ease: "power3.out" }),
    }));

    const apply = (nx: number, ny: number) => {
      movers.forEach((m) => {
        m.x(nx * m.depth);
        m.y(ny * m.depth);
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
  }, [reduced, isTouch, motion.heroParallax]);

  /* ------------------------------------------------------------------ *
   * 3. Scroll choreography — the camera move
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        // A longer scrub makes the film lag gently behind the wheel instead of
        // snapping frame-for-frame — the move lands slower and reads as cinema.
        // 0 in the dashboard means frame-perfect, which GSAP spells `true`.
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: motion.heroScrub > 0 ? motion.heroScrub : true,
        },
        defaults: { ease: "none" },
      });

      // The dolly. The plate already overscans by 3%, so scaling it can never
      // expose an edge — it just pushes the camera into the scene. Every tween
      // is given an explicit duration so the timeline stays exactly 1 unit
      // long.
      //
      // On a phone the film is flush with its frame and the framing has to be
      // final from the first frame, so there is no push-in there at all: the
      // picture you land on is the picture you keep.
      if (!portrait) tl.to(plateRef.current, { scale: motion.heroDolly, yPercent: -2, duration: 1 }, 0);
      tl.to(backdropRef.current, { scale: 1.1, opacity: 0.35, duration: 1 }, 0)
        .to(orbsRef.current, { yPercent: -20, opacity: 0.25, duration: 1 }, 0)
        // The hint has done its job well before the end — it is off screen
        // ahead of the final frames, so the last image is pure footage.
        .to(hintRef.current, { autoAlpha: 0, duration: 0.1 }, 0.78)
        // Last beat only: the stage fades to ink so the pin releases into the
        // intro section below as a cut rather than a jolt.
        .to(darkRef.current, { opacity: 0.9, duration: 0.12 }, 0.88);
    }, section);

    return () => ctx.revert();
  }, [reduced, portrait, motion.heroScrub, motion.heroDolly]);

  /* ------------------------------------------------------------------ *
   * 4. Opening — the first frame fades up as the preloader hands over
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!ready || reduced) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        // Only opacity: the scrubbed timeline owns `scale` on this element,
        // and two tweens fighting over one transform is how heroes tear.
        .from(plateRef.current, { opacity: 0, duration: 1.9 }, 0);
    }, sectionRef);
    return () => ctx.revert();
  }, [ready, reduced]);

  const goDown = () => scrollToId("intro");

  /**
   * The film's own stage. Full bleed is the committed framing; the dashboard's
   * Motion tab can inset it, and the plate is then centred in the leftover
   * space with the dark stage showing around it — a letterbox the owner asked
   * for rather than one imposed by an aspect ratio.
   */
  const insetStage = motion.heroWidthPct < 100 || motion.heroHeightPct < 100;
  const plateBox: React.CSSProperties | undefined = insetStage
    ? {
        left: `${(100 - motion.heroWidthPct) / 2}%`,
        right: `${(100 - motion.heroWidthPct) / 2}%`,
        top: `${(100 - motion.heroHeightPct) / 2}%`,
        bottom: `${(100 - motion.heroHeightPct) / 2}%`,
      }
    : undefined;

  return (
    <section
      id="home"
      ref={sectionRef}
      data-tune="sec-hero"
      className="hero-run relative isolate w-full bg-ink-950"
      style={
        pinned
          ? ({ "--hero-run": `${Math.round(motion.heroScrollVh * 100)}vh` } as React.CSSProperties)
          : undefined
      }
      aria-label="Cinematic reel"
    >
      {/* Sticky stage: the film holds while the scroll length plays out. */}
      <div className="stage-full sticky top-0 w-full overflow-hidden bg-ink-950">
        {/* One perspective for every plane — that is what makes the depth real. */}
        <div
          className="absolute inset-0"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
        >
          {/* Far plane — the artwork, pushed back and defocused. */}
          <div
            ref={backdropRef}
            data-tune="item-hero-backdrop"
            className="absolute inset-0 z-0"
            aria-hidden="true"
            // The opacity is inline rather than a class so the scrubbed
            // timeline above tweens from the slot's own value.
            style={{ willChange: "transform", opacity: backdropOpacity }}
          >
            <img
              src={backdropSrc}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              style={{ filter: `blur(${backdropBlur}px)` }}
              decoding="async"
            />
          </div>

          {/*
            The film. Full bleed either way, and it never moves: on a landscape
            screen it overscans by 3% so the dolly can push in without ever
            showing an edge, and on a tall screen it is flush — starting just
            below the header bar (72px) so that bar can never cover a frame of
            it. Nothing is ever drawn over it.
          */}
          <div
            ref={plateRef}
            data-tune="item-hero-plate"
            className={`absolute z-[2] origin-center ${
              insetStage ? "" : portrait ? "inset-x-0 bottom-0 top-[72px]" : "inset-[-3%]"
            }`}
            style={{ willChange: "transform", ...plateBox }}
          >
            <ScrollMedia progressRef={progressRef} />
          </div>

          {/* Mid plane — haze drifting between the film and the lens. */}
          {effects.fog ? <FogCanvas className="z-[4] opacity-40" /> : null}

          {/* Near plane — bokeh that sweeps past fastest of all. */}
          <div
            ref={orbsRef}
            className="pointer-events-none absolute inset-0 z-[18]"
            aria-hidden="true"
            style={{ willChange: "transform" }}
          >
            <div
              className="absolute left-[8%] top-[62%] h-24 w-24 rounded-full blur-2xl"
              style={{ background: "radial-gradient(circle, rgb(var(--accent-rgb) / 0.4), transparent 70%)" }}
            />
            <div
              className="absolute right-[16%] top-[22%] h-16 w-16 rounded-full blur-2xl"
              style={{ background: "radial-gradient(circle, rgb(var(--accent-rgb) / 0.32), transparent 70%)" }}
            />
            <div
              className="absolute bottom-[14%] left-[38%] h-28 w-28 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgb(var(--blood-700-rgb) / 0.35), transparent 70%)" }}
            />
          </div>
        </div>

        {/* Grade — just enough lift for the navbar and the scroll hint to sit
            on a dark film without flattening it. */}
        <div
          className="pointer-events-none absolute inset-0 z-[24]"
          aria-hidden="true"
          style={{
            background: [
              "linear-gradient(to top, rgb(var(--ink-950-rgb) / 0.55) 0%, rgb(var(--ink-950-rgb) / 0.2) 12%, transparent 24%)",
              "linear-gradient(to bottom, rgb(var(--ink-950-rgb) / 0.74) 0%, rgb(var(--ink-950-rgb) / 0.18) 15%, transparent 36%)",
              "linear-gradient(to right, rgb(var(--ink-950-rgb) / 0.6) 0%, transparent 48%)",
              "radial-gradient(125% 95% at 50% 45%, transparent 45%, rgb(var(--ink-950-rgb) / 0.6) 100%)",
            ].join(", "),
          }}
        />

        {/* End-of-run floor so the pin releases as a cut, not a jolt. */}
        <div
          ref={darkRef}
          className="pointer-events-none absolute inset-0 z-[34] bg-ink-950 opacity-0"
          aria-hidden="true"
        />

        {/* Scroll hint — the rail doubles as the position through the run, so
            a pinned section never feels like it has stalled. It leaves before
            the last frames, so no word ever sits on them. */}
        <div
          ref={hintRef}
          data-tune="item-hero-hint"
          className="absolute inset-x-0 bottom-7 z-40 flex justify-center sm:bottom-9"
        >
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
            {/* Without a pinned run there is nothing to indicate, so the rail
                only appears when the hero actually scrubs. */}
            {pinned ? (
              <span className="relative block h-10 w-px overflow-hidden bg-bone/15">
                <span
                  ref={barRef}
                  className="absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-bone/70"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-0 top-0 h-4 animate-scroll-pulse bg-blood-500" />
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </section>
  );
}
