import { Suspense, lazy, useEffect, useRef, useState, type RefObject } from "react";
import { useMediaConfig, type MediaConfig } from "../../lib/siteData";
import { usePrefersReducedMotion } from "../../lib/hooks";

/**
 * Three.js is by far the heaviest dependency, and it is only needed for the
 * default procedural scene — so it is split into its own chunk and fetched
 * after the first paint rather than blocking the hero.
 */
const NinjaScene = lazy(() => import("../hero/NinjaScene"));

/**
 * ============================================================================
 *  SCROLL MEDIA — the hero's centrepiece, whatever the owner configured
 * ============================================================================
 *  Three modes, in order of preference:
 *
 *    sequence  a numbered image sequence (001.jpg, 002.jpg …) scrubbed by
 *              scroll position — the cinematic effect, and the lightest to
 *              run on a phone because every frame is a small still
 *    video     one looping MP4/WebM, autoplayed muted, with a poster fallback
 *    scene     the built-in procedural WebGL scene
 *
 *  A ZIP is never playable in a browser, so it is not offered — see
 *  docs/ASSET_WORKFLOW.md for how to export either supported format.
 *
 *  If a configured sequence or video cannot load, this falls back to the
 *  procedural scene rather than leaving a black rectangle.
 * ============================================================================
 */

/** 001.webp, 002.webp … zero-padded to three digits. */
export function frameUrl(media: MediaConfig, index: number): string {
  const directory = media.frameDir.replace(/\/+$/, "");
  return `${directory}/${String(index).padStart(3, "0")}.${media.frameExt}`;
}

type MediaProps = {
  className?: string;
  /**
   * Scroll progress (0 → 1) owned by the pinned hero section. Passed in as a
   * ref — never as state — so a 300-frame scrub costs zero React renders.
   */
  progressRef?: RefObject<number>;
};

export default function ScrollMedia({ className = "", progressRef }: MediaProps) {
  const media = useMediaConfig();
  const [failed, setFailed] = useState(false);

  // Reset the failure flag whenever the owner changes the configuration.
  useEffect(() => {
    setFailed(false);
  }, [media.mode, media.videoSrc, media.frameDir, media.frameCount]);

  const mode = failed ? "scene" : media.mode;

  if (mode === "sequence" && media.frameDir && media.frameCount > 0) {
    return (
      <SequenceMedia
        media={media}
        className={className}
        progressRef={progressRef}
        onFail={() => setFailed(true)}
      />
    );
  }

  if (mode === "video" && media.videoSrc) {
    return <VideoMedia media={media} className={className} onFail={() => setFailed(true)} />;
  }

  return (
    <Suspense fallback={<div className={`${className} h-full w-full`} aria-hidden="true" />}>
      <NinjaScene className={className} />
    </Suspense>
  );
}

/* -------------------------------------------------------------------------- */
/*  Video                                                                     */
/* -------------------------------------------------------------------------- */

function VideoMedia({
  media,
  className,
  onFail,
}: {
  media: MediaConfig;
  className: string;
  onFail: () => void;
}) {
  return (
    <video
      className={`${className} h-full w-full object-cover`}
      src={media.videoSrc}
      poster={media.poster || undefined}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      // The clip is decoration: it must never be announced or focusable.
      aria-hidden="true"
      tabIndex={-1}
      onError={onFail}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Scroll-scrubbed image sequence                                            */
/* -------------------------------------------------------------------------- */

/**
 * Ceiling on how many frames we are willing to hold. The shipped hero run is
 * 300 stills; the extra headroom is here so an owner can export a longer pass
 * without hitting a silent truncation.
 */
const MAX_FRAMES = 420;

/** How many frames to spread the first "keyframe ladder" across. */
const LADDER_STEPS = 24;
/** Parallel image requests. Browsers cap at ~6 per host anyway. */
const LADDER_CONCURRENCY = 4;
const STREAM_CONCURRENCY = 6;
/** Give up on the very first frame after this long and fall back to the scene. */
const FIRST_FRAME_TIMEOUT = 8000;

function SequenceMedia({
  media,
  className,
  progressRef,
  onFail,
}: {
  media: MediaConfig;
  className: string;
  progressRef?: RefObject<number>;
  onFail: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const decodedRef = useRef<boolean[]>([]);
  const wantedRef = useRef(0);
  const drawnRef = useRef(-1);
  const readyRef = useRef(false);
  const localProgressRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const reduced = usePrefersReducedMotion();

  const count = Math.max(1, Math.min(MAX_FRAMES, media.frameCount));

  /** Paint frame `index`, cover-fitted into the canvas. */
  const draw = (index: number, force = false) => {
    const canvas = canvasRef.current;
    const image = framesRef.current[index];
    if (!canvas || !image || !image.complete || !image.naturalWidth) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;

    const backingWidth = Math.round(width * dpr);
    const backingHeight = Math.round(height * dpr);
    // A resize keeps the same frame index but changes the backing store, so
    // the "already drawn" shortcut only holds while the size is unchanged.
    const resized = canvas.width !== backingWidth || canvas.height !== backingHeight;
    if (drawnRef.current === index && !resized && !force) return;

    if (resized) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    drawnRef.current = index;
  };

  /**
   * Nearest frame that is actually decoded. Decoding 300 stills takes a
   * moment, so scrubbing fast must show the closest available frame instead
   * of freezing on a stale one — backwards first, because a frame slightly
   * behind the playhead reads as lag, while one ahead reads as a jump cut.
   */
  const nearestDecoded = (index: number): number => {
    const decoded = decodedRef.current;
    if (decoded[index]) return index;
    for (let d = 1; d < count; d++) {
      if (decoded[index - d]) return index - d;
      if (decoded[index + d]) return index + d;
    }
    return -1;
  };

  /* ------------------------------------------------------------------ *
   * Decode the run, progressively: frame 1 immediately (so the stage is
   * never blank), then a coarse ladder, then the rest in order.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = new Array(count);
    const decoded: boolean[] = new Array(count).fill(false);
    framesRef.current = images;
    decodedRef.current = decoded;
    readyRef.current = false;
    drawnRef.current = -1;
    wantedRef.current = 0;

    const timeout = window.setTimeout(() => {
      if (!cancelled && !readyRef.current) onFail();
    }, FIRST_FRAME_TIMEOUT);

    const load = (index: number) =>
      new Promise<void>((resolve) => {
        if (cancelled) return resolve();
        const image = new Image();
        image.decoding = "async";
        // Only the opening frame is worth competing with the page for
        // bandwidth; the other 299 must never delay first paint.
        image.setAttribute("fetchpriority", index === 0 ? "high" : "low");
        image.onload = () => {
          decoded[index] = true;
          if (cancelled) return resolve();
          if (index === 0 && !readyRef.current) {
            readyRef.current = true;
            window.clearTimeout(timeout);
            setReady(true);
            draw(0, true);
          }
          // The frame under the playhead arrived after we settled on a
          // neighbour — repaint so the stage snaps onto it at rest.
          if (index === wantedRef.current) draw(index);
          resolve();
        };
        // A single missing frame must not stall the whole run: leave it
        // undecoded and let `nearestDecoded` step over it.
        image.onerror = () => {
          if (index === 0) {
            window.clearTimeout(timeout);
            if (!cancelled) onFail();
          }
          resolve();
        };
        images[index] = image;
        image.src = frameUrl(media, index);
      });

    const runQueue = async (queue: number[], concurrency: number) => {
      let cursor = 0;
      const worker = async () => {
        while (!cancelled) {
          const index = queue[cursor];
          cursor += 1;
          if (index === undefined) return;
          await load(index);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(concurrency, queue.length) || 0 }, worker),
      );
    };

    void (async () => {
      await runQueue([0], 1);
      if (cancelled) return;

      const step = Math.max(1, Math.ceil(count / LADDER_STEPS));
      const ladder: number[] = [];
      for (let i = step; i < count; i += step) ladder.push(i);
      await runQueue(ladder, LADDER_CONCURRENCY);
      if (cancelled) return;

      const rest: number[] = [];
      for (let i = 0; i < count; i++) if (!ladder.includes(i) && i !== 0) rest.push(i);
      await runQueue(rest, STREAM_CONCURRENCY);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      // Drop every reference (and cancel anything still in flight) so a
      // route change does not leave 300 bitmaps pinned in memory.
      framesRef.current.forEach((image, i) => {
        if (image && !decoded[i]) image.src = "";
      });
      framesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.frameDir, media.frameExt, count]);

  /* ------------------------------------------------------------------ *
   * Scrub. Progress comes from the pinned hero section when it hands one
   * over, otherwise from this element's own scroll travel (standalone use).
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const host = hostRef.current;
    // Reduced motion pins one frame instead — see the effect below. Returning
    // early here also stops a stray resize from scrubbing that frame away.
    if (!host || reduced) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const handed = progressRef?.current;
      let progress: number;
      if (typeof handed === "number") {
        progress = handed;
      } else {
        // Standalone use: this element is itself the tall, scrollable track.
        const rect = host.getBoundingClientRect();
        const travel = Math.max(1, rect.height - window.innerHeight);
        localProgressRef.current = Math.max(0, Math.min(1, -rect.top / travel));
        progress = localProgressRef.current;
      }
      const index = Math.round(Math.max(0, Math.min(1, progress)) * (count - 1));
      wantedRef.current = index;
      const frame = decodedRef.current[index] ? index : nearestDecoded(index);
      if (frame >= 0) draw(frame);
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      drawnRef.current = -1; // backing store is stale at the new size
      schedule();
    };

    update();
    if (ready) setShowPoster(false);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, count, progressRef, reduced]);

  // Reduced motion: hold a single mid-sequence frame instead of scrubbing.
  useEffect(() => {
    if (!reduced || !ready) return;
    draw(Math.floor(count / 2), true);
    setShowPoster(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ready, count]);

  return (
    <div ref={hostRef} className={`${className} relative h-full w-full`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 700ms cubic-bezier(0.16,1,0.3,1)" }}
      />
      {showPoster && media.poster ? (
        <img
          src={media.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="eager"
          decoding="async"
        />
      ) : null}
    </div>
  );
}
