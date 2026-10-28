import { useEffect, useRef } from "react";
import { hero as heroContent } from "../../data/content";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { reportHeroRun, releaseHeroGate } from "../../lib/heroGate";
import { scrollToId } from "../../lib/scroll";
import { useMobileMediaConfig, useStudio } from "../../lib/siteData";
import ScrollMedia from "../media/ScrollMedia";
import RotatingText from "../fx/RotatingText";

/**
 * ============================================================================
 *  MOBILE HERO — the portrait 3D run
 * ============================================================================
 *  Phones get their own film: the 685-frame portrait render merged from
 *  `PH Hero/ph1 + ph2 + ph3` and re-exported as 240 WebP stills at 640px
 *  (`public/assets/hero-mobile/`). The desktop run is never fetched here and
 *  this one is never fetched on desktop — each screen pays only for its film.
 *
 *  The stage is one screen tall and sticky; the section around it is the
 *  travel. Scrubbing is handed to `ScrollMedia` as a ref, so a 246-frame scrub
 *  costs zero React renders. The header is held back by `heroGate` until the
 *  run is essentially finished, so nothing ever covers the top of the picture.
 *
 *  Everything is editable from `#/admin → Artwork → Phone` (the film) and
 *  `#/admin → Studio → Motion → Phone` (run length, dolly, parallax, height).
 * ============================================================================
 */
export default function MobileHero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const hudRef = useRef<HTMLSpanElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const reduced = usePrefersReducedMotion();
  const media = useMobileMediaConfig();
  const { mobile } = useStudio();
  const pinned = !reduced;

  /* Progress → scrubbing, rail, camera drift, header gate. One rAF pass. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (reduced) {
      reportHeroRun(false, 1);
      return releaseHeroGate;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      progressRef.current = progress;

      if (barRef.current) barRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      if (hintRef.current) {
        // The hint leaves before the last frames, so the final picture is clean.
        hintRef.current.style.opacity = String(Math.max(0, Math.min(1, (0.82 - progress) / 0.14)));
      }
      if (topRef.current) {
        topRef.current.style.opacity = String(Math.max(0, Math.min(1, (0.9 - progress) / 0.2)));
        // The wordmark lifts and settles as the film starts to move, so the
        // opening screen has a little depth instead of a static plate.
        topRef.current.style.transform = `translate3d(0, ${(-progress * 26).toFixed(2)}px, 0)`;
      }
      if (hudRef.current) {
        const frame = Math.round(progress * (media.frameCount - 1));
        hudRef.current.textContent = `FRAME ${String(frame).padStart(3, "0")} / ${media.frameCount}`;
      }
      if (darkRef.current) {
        darkRef.current.style.opacity = String(Math.max(0, (progress - 0.86) / 0.14) * 0.72);
      }
      if (motionRef.current) {
        /*
         * The only per-frame transform on the picture: a small dolly and a
         * scroll-linked drift. No filter, no blur — those are what made the
         * old phone hero stutter, because each one re-composites a full-screen
         * layer on every frame.
         */
        const push = 1 + (mobile.dolly - 1) * progress;
        const drift = (progress - 0.5) * mobile.parallax * -6;
        motionRef.current.style.transform = `translate3d(0, ${drift.toFixed(2)}px, 0) scale(${push.toFixed(4)})`;
      }

      reportHeroRun(true, progress);
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
      releaseHeroGate();
    };
  }, [reduced, mobile.dolly, mobile.parallax]);

  /* Orientation change re-measures the sticky stage; iOS needs the nudge. */
  useEffect(() => {
    if (reduced) return;
    const onOrientation = () => window.dispatchEvent(new Event("resize"));
    window.addEventListener("orientationchange", onOrientation);
    return () => window.removeEventListener("orientationchange", onOrientation);
  }, [reduced]);

  const stageHeight = Math.min(100, Math.max(70, mobile.heightPct));

  return (
    <section
      id="home"
      ref={sectionRef}
      data-tune="sec-hero"
      className="hero-run relative isolate w-full bg-ink-950"
      style={
        pinned
          ? ({ "--hero-run": `${Math.round(mobile.scrollVh * 100)}vh` } as React.CSSProperties)
          : undefined
      }
      aria-label="Cinematic 3D reel"
    >
      <div
        /* `hero-stage` sizes off the *visible* viewport (svh fallback, then
           dvh), so a collapsing phone toolbar can never leave a strip of empty
           stage under the film while the run is pinned. */
        className="hero-stage sticky top-0 w-full overflow-hidden bg-ink-950"
        style={{ "--stage-h": stageHeight } as React.CSSProperties}
      >
        {/* A quiet field behind the film — gradients only, so there is no
            second full-screen canvas competing with the frames on a phone. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 18%, rgb(var(--blood-900-rgb) / 0.5) 0%, rgb(var(--ink-950-rgb)) 62%), linear-gradient(180deg, rgb(var(--ink-950-rgb)) 0%, rgb(var(--ink-900-rgb)) 100%)",
          }}
        />

        {/* The film. */}
        <div
          ref={motionRef}
          className="absolute inset-0 origin-center"
          style={{
            willChange: "transform",
            opacity: ready ? 1 : 0,
            transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* `contain`: the portrait render is 4:5, so covering a full-screen
              phone stage would cut roughly a third of the frame away — the
              outermost edge of every camera move. It is drawn whole, at exactly
              the width the phone gives it, on the stage's own field. */}
          <ScrollMedia progressRef={progressRef} mediaOverride={media} fit="contain" />
        </div>

        {/* Grade: enough for the wordmark, the hint and the hand-off into the
            intro to stay legible without flattening the render. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "linear-gradient(to bottom, rgb(var(--ink-950-rgb) / 0.72) 0%, transparent 22%)",
              "linear-gradient(to top, rgb(var(--ink-950-rgb) / 0.85) 0%, rgb(var(--ink-950-rgb) / 0.25) 16%, transparent 38%)",
              "radial-gradient(130% 100% at 50% 45%, transparent 55%, rgb(var(--ink-950-rgb) / 0.5) 100%)",
            ].join(", "),
          }}
        />

        {/* Wordmark — the only type over the film, and it fades before the end
            so the last frame is pure picture. */}
        <div
          ref={topRef}
          className="absolute inset-x-0 top-0 z-20 flex flex-col px-5"
          style={{
            paddingTop: "max(18px, env(safe-area-inset-top))",
            willChange: "transform",
          }}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blood-500" aria-hidden="true" />
              <span className="font-body text-[10px] uppercase tracking-cinematic text-bone/80">
                {heroContent.title}
              </span>
            </div>
            <span
              ref={hudRef}
              className="font-body text-[9px] uppercase tracking-cinematic text-bone-dim tabular-nums"
            >
              FRAME 000 / {media.frameCount}
            </span>
          </div>

          {/*
            The living line. It only appears when the letterbox above the
            picture is genuinely tall enough to hold it (short phones keep the
            bare wordmark row), so nothing here can ever land on the film.
          */}
          <div className="mt-4 hidden w-full [@media(min-height:720px)]:block">
            <p
              className="display text-[10.5vw] leading-[0.94] text-bone"
              style={{
                opacity: ready ? 1 : 0,
                transform: ready ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1) 180ms, transform 900ms cubic-bezier(0.16,1,0.3,1) 180ms",
              }}
            >
              <span className="block text-bone/45">Sites that</span>
              <span className="block text-blood-400">
                <RotatingText items={["CONVERT", "MOVE", "LAST", "SELL", "STICK"]} />
              </span>
            </p>
          </div>
        </div>

        {/* End-of-run floor: the pin releases into the intro as a cut. */}
        <div
          ref={darkRef}
          className="pointer-events-none absolute inset-0 z-30 bg-ink-950 opacity-0"
          aria-hidden="true"
        />

        {/* Corner slugs — the small technical print that fills the lower
            letterbox the way a title card does. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-20 flex items-end justify-between px-5"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 74px)" }}
        >
          {/* The hallmark: a slowly turning stamp, the one bit of the opening
              screen that keeps moving after the scroll has stopped. Hidden on
              short phones so it can never crowd the scroll hint. */}
          <span className="hidden [@media(min-height:720px)]:block">
            <svg
              viewBox="0 0 100 100"
              className="spin-slow h-[62px] w-[62px] text-bone/45"
              aria-hidden="true"
            >
              <defs>
                <path
                  id="hero-stamp"
                  d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0"
                />
              </defs>
              <text
                fill="currentColor"
                fontSize="8.5"
                letterSpacing="2.6"
                style={{ fontFamily: "inherit", textTransform: "uppercase" }}
              >
                <textPath href="#hero-stamp" startOffset="0">
                  {`${heroContent.accent} STUDIO · DESIGN · MOTION · 3D · `}
                </textPath>
              </text>
              <circle cx="50" cy="50" r="1.6" fill="currentColor" />
            </svg>
          </span>
          <span className="font-body text-[8px] uppercase tracking-cinematic text-bone-dim/80">
            3D · 2026
          </span>
        </div>

        {/* Scroll hint — a rail that doubles as the run's own progress. */}
        <div
          ref={hintRef}
          className="absolute inset-x-0 z-40 flex flex-col items-center gap-3"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 22px)" }}
        >
          <button
            type="button"
            onClick={() => scrollToId("intro")}
            className="flex flex-col items-center gap-2.5"
            aria-label="Scroll to explore"
          >
            <span className="font-body text-[9px] uppercase tracking-cinematic text-bone-dim">
              {heroContent.scrollHint}
            </span>
            {pinned ? (
              <span className="relative block h-px w-20 overflow-hidden bg-bone/20">
                <span
                  ref={barRef}
                  className="absolute inset-0 origin-left scale-x-0 bg-bone/80"
                  aria-hidden="true"
                />
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </section>
  );
}
