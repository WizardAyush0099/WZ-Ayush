import { useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { useStudio } from "../../lib/siteData";
import {
  stageDistanceVh,
  stageFirstFrame,
  stageMedia,
  stagePosition,
  type Stage,
} from "../../lib/studio";
import ScrollMedia from "../media/ScrollMedia";

/**
 * ============================================================================
 *  STAGE BAND — a 3D run from the dashboard, played inside the page
 * ============================================================================
 *  This is what a “stage” is on the site: a band of the page that holds one
 *  numbered run of frames and scrubs it as the visitor scrolls past, exactly
 *  the way the hero's opening film works. It is part of the page — a real
 *  element in normal flow, rendering through the same sequence renderer the
 *  hero uses — not an embed or an iframe, so it inherits the site's
 *  typography, its palette and its scroll behaviour.
 *
 *  Four things the owner sets, and what they mean here:
 *
 *    frames     the folder the .zip was extracted into (zero-padded, `000`
 *               first), how many frames, and the extension — read from GitHub
 *               or from `public/assets/`, no upload step in between
 *    window     which passage of the run plays: `from` and `to`, 0 → 1
 *    distance   how many screens of scroll that passage takes (`spanVh`),
 *               divided by `speed` — so faster means the run finishes sooner
 *    size       the frame's width as a percentage of the page and either a
 *               pixel height or one of the aspect ratios
 *
 *  `loop` mode plays the run on its own timer instead of the scroll, and
 *  `pingPong` makes either mode reverse at the end rather than cutting back —
 *  the difference between an animation that breathes and one that restarts.
 * ============================================================================
 */

/** Where the frame parks while its run plays, as a percentage of the viewport. */
const STICK_TOP = 12;

export default function StageBand({ stage }: { stage: Stage }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const reduced = usePrefersReducedMotion();
  const runSpeed = useStudio().motion.runSpeed;

  const distance = stageDistanceVh(stage, runSpeed);
  const media = useMemo(
    () => ({ ...stageMedia(stage), poster: stage.poster || stageFirstFrame(stage) }),
    [stage.dir, stage.count, stage.ext, stage.poster],
  );

  /* ------------------------------------------------------------------ *
   * Scrub — or, in loop mode, run on its own clock.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (reduced) {
      progressRef.current = 0.5;
      return;
    }

    let raf = 0;

    const paint = (position: number, shown: number) => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${position.toFixed(4)})`;
      if (readoutRef.current) {
        const index = Math.round(stagePosition(stage, position) * Math.max(1, stage.count - 1));
        readoutRef.current.textContent = `${String(Math.max(0, index)).padStart(3, "0")} / ${String(shown).padStart(3, "0")}`;
      }
    };

    if (stage.mode === "loop") {
      /*
       * A run that plays itself: `fps` frames a second, so a 120-frame run at
       * 24fps is a five-second loop. Ping-pong doubles the wall time because
       * the second half walks back down the same frames.
       */
      const span = Math.max(1, stage.count - 1) / Math.max(1, stage.fps);
      const duration = span * (stage.pingPong ? 2 : 1);
      const start = performance.now();
      const tick = (now: number) => {
        const position = ((now - start) / 1000 / duration) % 1;
        progressRef.current = stagePosition(stage, position);
        paint(position, stage.count);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    const update = () => {
      raf = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      // The run plays across the band's own travel minus the frame's height,
      // so the last frame lands exactly as the frame starts moving again.
      const height = rect.height - (track.firstElementChild?.clientHeight ?? 0);
      const travel = Math.max(1, height - (STICK_TOP / 100) * window.innerHeight);
      const position = Math.max(0, Math.min(1, -rect.top / travel));
      progressRef.current = stagePosition(stage, position);
      paint(position, stage.count);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stage.mode,
    stage.count,
    stage.fps,
    stage.pingPong,
    stage.from,
    stage.to,
    stage.ease,
    stage.speed,
    reduced,
  ]);

  const frameClass = stage.heightPx
    ? { height: `${stage.heightPx}px` }
    : { aspectRatio: stage.aspect.replace("/", " / ") };

  return (
    <div
      ref={trackRef}
      data-tune={`stage-${stage.id}`}
      className="relative z-10 bg-ink-950"
      style={{ height: `${distance}vh` }}
    >
      <div
        className="sticky flex w-full justify-center px-4 sm:px-6"
        style={{ top: `${STICK_TOP}vh` }}
      >
        <figure
          className="relative m-0 w-full overflow-hidden border border-bone/10 bg-ink-950"
          style={{
            ...frameClass,
            width: `${stage.widthPct}%`,
            maxWidth: `${stage.widthPct}%`,
            borderRadius: stage.radius ? `${stage.radius}px` : undefined,
            opacity: stage.opacity,
          }}
        >
          <ScrollMedia mediaOverride={media} progressRef={progressRef} />

          {/* A floor under the frame, so the caption stays legible over any run. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgb(var(--ink-950-rgb) / ${stage.shade}), transparent 55%)`,
            }}
          />

          {stage.caption ? (
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
              <span className="max-w-[52ch] font-body text-[11px] leading-relaxed tracking-wide2 text-bone/90 sm:text-xs">
                {stage.caption}
              </span>
            </figcaption>
          ) : null}

          {/* The run's own readout: which frame of how many, and how far through. */}
          <span className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 border border-bone/15 bg-ink-950/70 px-2.5 py-1.5 font-mono text-[10px] text-bone-muted backdrop-blur-sm sm:right-6 sm:top-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-blood-500" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blood-500" />
            </span>
            <span ref={readoutRef}>000 / {String(stage.count).padStart(3, "0")}</span>
          </span>

          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-bone/15">
            <span
              ref={barRef}
              className="block h-px origin-left scale-x-0 bg-blood-500 transition-transform duration-100 ease-linear"
            />
          </span>
        </figure>
      </div>
    </div>
  );
}
