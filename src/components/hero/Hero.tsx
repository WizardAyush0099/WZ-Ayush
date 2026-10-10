import { useEffect, useRef, useState } from "react";
import { gsap } from "../../lib/gsap";
import { contact, hero as heroContent } from "../../data/content";
import { useIsTouch, usePrefersReducedMotion } from "../../lib/hooks";
import { linkTo } from "../../lib/router";
import { scrollToId } from "../../lib/scroll";
import { useSiteData } from "../../lib/siteData";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";
import ScrollMedia from "../media/ScrollMedia";
import FogCanvas from "../fx/FogCanvas";

/**
 * ============================================================================
 *  HERO — a scroll-driven film, then a title card
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
 *  Nothing is written over the footage while it plays. The title card — the
 *  wordmark, headline, calls to action and direct contact — arrives only once
 *  the run is complete (`CARD_AT`), on a scrim that fades up with it. That is
 *  the whole point: the film is the hero, and the type is its closing beat.
 *
 *  Every plane shares one perspective on the container, and a single scrubbed
 *  GSAP timeline dollies the film in while the haze lifts. At the end of the
 *  run the stage darkens so the pin releases into the next (equally dark)
 *  section as a cut rather than a jolt.
 * ============================================================================
 */

/**
 * Scroll progress at which the film hands over to the title card. Late enough
 * that the frame run is finished, early enough that the card is still held by
 * the pin (so it is read, not scrolled past).
 */
const CARD_AT = 0.62;

export default function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);

  /** Scroll position through the pinned run, read by the frame scrubbing. */
  const progressRef = useRef(0);

  /** True once the run is over — flips the title card on. */
  const [revealed, setRevealed] = useState(false);

  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouch();
  const site = useSiteData();

  /**
   * Pinned only when the visitor is happy with motion. Reduced motion keeps a
   * single screen: one held frame, no scrub, the copy fully legible from the
   * first paint.
   */
  const pinned = !reduced;
  const cardVisible = reduced || revealed;

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
      const next = progress >= CARD_AT;
      setRevealed((prev) => (prev === next ? prev : next));
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
    if (!section || reduced) return;

    // `z` places each plane on a real 3D plane inside the stage's perspective.
    const rawLayers: Array<{ el: HTMLElement | null; depth: number; z: number }> = [
      { el: backdropRef.current, depth: 5, z: -110 },
      { el: plateRef.current, depth: 11, z: -40 },
      { el: orbsRef.current, depth: 60, z: 60 },
      { el: copyRef.current, depth: 9, z: 20 },
    ];
    const layers = rawLayers.filter(
      (l): l is { el: HTMLElement; depth: number; z: number } => l.el !== null,
    );

    layers.forEach((l) => gsap.set(l.el, { z: l.z, transformPerspective: 1400 }));

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
        m.rx(nx * m.depth * 0.16);
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
   * 3. Scroll choreography — the camera move behind the title card
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 },
        defaults: { ease: "none" },
      });

      // The dolly. The plate already overscans by 3%, so scaling it can never
      // expose an edge — it just pushes the camera into the scene. Every tween
      // is given an explicit duration so the timeline stays exactly 1 unit
      // long and `CARD_AT` keeps meaning what it says.
      tl.to(plateRef.current, { scale: 1.16, yPercent: -2, duration: 1 }, 0)
        .to(backdropRef.current, { scale: 1.1, opacity: 0.35, duration: 1 }, 0)
        .to(orbsRef.current, { yPercent: -20, opacity: 0.25, duration: 1 }, 0)
        // The rail has said everything it can by the time the card arrives.
        .to(hintRef.current, { autoAlpha: 0, duration: 0.08 }, CARD_AT - 0.1)
        // Final beat: the stage darkens so the pin releases as a cut.
        .to(darkRef.current, { opacity: 0.9, duration: 0.2 }, 0.8);
    }, section);

    return () => ctx.revert();
  }, [reduced]);

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

  const goDown = () => scrollToId("story");

  return (
    <section
      id="home"
      ref={sectionRef}
      className="hero-run relative isolate w-full bg-ink-950"
      style={pinned ? ({ "--hero-run": site.media.scrollLength } as React.CSSProperties) : undefined}
      aria-label="Hero"
    >
      {/* Sticky stage: the film holds while the scroll length plays out.
          Exactly one viewport tall, never more — the title card is anchored to
          the stage's bottom edge, so a stage taller than the screen would push
          the card's last line out of view. */}
      <div className="stage-full sticky top-0 w-full overflow-hidden bg-ink-950">
        {/* One perspective for every plane — that is what makes the depth real. */}
        <div
          className="absolute inset-0"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
        >
          {/* Far plane — the artwork, pushed back and defocused. */}
          <div
            ref={backdropRef}
            className="absolute inset-0 z-0 opacity-30"
            aria-hidden="true"
            style={{ willChange: "transform" }}
          >
            <img
              src={site.assets.heroShadow}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              style={{ filter: "blur(22px)" }}
              decoding="async"
            />
          </div>

          {/* The film. Full bleed, and 3% overscanned so the dolly never
              shows an edge. Nothing is drawn over it while it runs. */}
          <div
            ref={plateRef}
            className="absolute inset-[-3%] z-[2] origin-center"
            style={{ willChange: "transform" }}
          >
            <ScrollMedia progressRef={progressRef} />
          </div>

          {/* Mid plane — haze drifting between the film and the type. */}
          <FogCanvas className="z-[4] opacity-40" />

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

        {/* Grade — just enough lift for the navbar to sit on a dark film
            without flattening it. */}
        <div
          className="pointer-events-none absolute inset-0 z-[24]"
          aria-hidden="true"
          style={{
            background: [
              "linear-gradient(to bottom, rgb(var(--ink-950-rgb) / 0.74) 0%, rgb(var(--ink-950-rgb) / 0.18) 15%, transparent 36%)",
              "linear-gradient(to right, rgb(var(--ink-950-rgb) / 0.6) 0%, transparent 48%)",
              "radial-gradient(125% 95% at 50% 45%, transparent 45%, rgb(var(--ink-950-rgb) / 0.6) 100%)",
            ].join(", "),
          }}
        />

        {/* ------------------------------------------------------------------
            Title card. It is not on screen while the film runs: none of this
            text sits over the footage. It fades up on its own scrim once the
            sequence has finished, still held in place by the pin.
        ------------------------------------------------------------------ */}
        <div
          className={`pointer-events-none absolute inset-0 z-[30] transition-opacity duration-[1200ms] ease-silk ${
            cardVisible ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
          style={{
            background: [
              "linear-gradient(to top, rgb(var(--ink-950-rgb) / 0.96) 0%, rgb(var(--ink-950-rgb) / 0.9) 28%, rgb(var(--ink-950-rgb) / 0.58) 60%, rgb(var(--ink-950-rgb) / 0.14) 84%, transparent 100%)",
            ].join(", "),
          }}
        />

        <div className="shell pointer-events-none absolute inset-x-0 bottom-[7%] z-40 sm:bottom-[9%]">
          <div
            ref={copyRef}
            className="max-w-[640px] lg:max-w-[720px]"
            style={{ willChange: "transform" }}
          >
            <div
              className={`pointer-events-auto transition-[opacity,transform] duration-[1100ms] ease-silk ${
                cardVisible
                  ? "visible translate-y-0 opacity-100"
                  : "invisible translate-y-8 opacity-0"
              }`}
            >
              <p className="mb-5 inline-flex items-center gap-3 border border-bone/10 bg-ink-950/40 px-4 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blood-500" />
                </span>
                Available for work
              </p>

              <p className="eyebrow mb-3 opacity-90">{heroContent.traits}</p>

              {/* Wordmark — the hero's title, arriving with the card. */}
              <span className="display text-hollow block text-[clamp(2.6rem,min(21vw,14svh),10rem)] leading-none">
                {heroContent.title}
              </span>

              <p className="display mt-3 text-[clamp(1.35rem,min(8vw,6.4svh),4rem)] leading-[0.98] text-bone">
                {heroContent.tagline}
              </p>

              <p className="card-optional mt-4 max-w-[46ch] font-body text-[12.5px] leading-relaxed text-bone-muted sm:text-[13.5px] lg:text-sm">
                {heroContent.lede}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={linkTo("/builder")}
                  data-cursor="hover"
                  className="btn border-blood-600/70 bg-blood-600/15 px-5 py-3.5 text-[11px] sm:px-8 sm:py-4 sm:text-[12px]"
                >
                  {heroContent.primaryCta}
                  <span aria-hidden="true">→</span>
                </a>
                <button
                  type="button"
                  onClick={() => scrollToId("work")}
                  data-cursor="hover"
                  className="group inline-flex items-center gap-2 border border-bone/20 px-5 py-3.5 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-500 ease-silk hover:border-bone/40 hover:text-bone sm:px-6 sm:py-4 sm:text-[12px]"
                >
                  {heroContent.secondaryCta}
                </button>
              </div>

              {/* Direct contact — always one tap away once the card lands. */}
              <div className="card-optional mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                <a
                  href={buildWhatsAppUrl(introMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="hover"
                  className="group flex items-center gap-2 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
                  WhatsApp {contact.whatsappDisplay}
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  data-cursor="hover"
                  className="group flex items-center gap-2 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone"
                >
                  <span aria-hidden="true">✉</span>
                  {contact.email}
                </a>
              </div>
            </div>
          </div>

          {/* Keeps the document outline intact, whether or not the card has
              arrived yet. */}
          <h1 className="sr-only">
            {heroContent.title} — {heroContent.tagline}
          </h1>
        </div>

        {/* End-of-run floor so the pin releases as a cut, not a jolt. */}
        <div
          ref={darkRef}
          className="pointer-events-none absolute inset-0 z-[34] bg-ink-950 opacity-0"
          aria-hidden="true"
        />

        {/* Scroll hint — the rail doubles as the position through the run, so
            a 360vh pinned section never feels like it has stalled. It hands
            over to the title card at the end. */}
        <div
          ref={hintRef}
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
