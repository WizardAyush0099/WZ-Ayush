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
   * ref — never as state — so a 400-frame scrub costs zero React renders.
   */
  progressRef?: RefObject<number>;
  /**
   * Use a specific run instead of the dashboard-configured one, for a stage
   * that owns its own render rather than following the Artwork tab.
   */
  mediaOverride?: MediaConfig;
  /**
   * How the film meets its stage. `cover` fills the stage edge to edge and
   * crops whatever falls outside it — right for a wide desktop stage. `contain`
   * draws the whole frame at the width the stage gives it, feathered at its top
   * and bottom edges — which is what a portrait film in a full-screen portrait
   * stage needs: a 640 × 801 render covering a phone would lose more than a
   * third of its width, and the perimeter of the camera move with it.
   */
  fit?: "cover" | "contain";
};

export default function ScrollMedia({
  className = "",
  progressRef,
  mediaOverride,
  fit = "cover",
}: MediaProps) {
  const configured = useMediaConfig();
  const media = mediaOverride ?? configured;
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
        fit={fit}
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
 * How much cover-zoom a stage may apply before the fit stops being a fit.
 *
 * Filling a stage means cropping, and cropping is only a problem when the
 * surviving slice has to be magnified past the resolution the frames were
 * rendered at — that is what reads as pixel mush. The hero's phone layout gives
 * the film a band across the top (about 2x crop) which still lands as a
 * *downscale* in the backing store, so it stays sharp; a film asked to cover a
 * whole portrait screen needs ~3.8x and does not. Past this ratio the frame is
 * drawn whole (fit inside) over a soft ambient field of the same still, so a
 * pathological aspect mismatch degrades into a letterbox instead of mush.
 *
 * The ceiling is deliberately high: filling the frame is what the owner asked
 * for on phones, and a soft-but-full picture is the preferred trade over a
 * sharp letterbox with a blurred field around it. It now only catches a source
 * so mismatched to its stage that covering it would be absurd (a square render
 * in a wide banner, say).
 */
const MAX_COVER_ZOOM = 4.5;

/**
 * Ceiling on how many frames we are willing to hold. The shipped hero run is
 * 421 stills (scene1 + scene2 merged); the extra headroom is here so an owner
 * can export a longer pass without hitting a silent truncation — the previous
 * 420 cap sat one frame above the shipped count, which is exactly the kind of
 * silent truncation this constant exists to prevent.
 */
const MAX_FRAMES = 600;

/**
 * The first ("keyframe ladder") pass, which decides how good the scrub looks
 * while the rest still streams in. `LADDER_MIN_STEPS` keeps a short run from
 * having too few waypoints; `LADDER_SPACING` is the real control — it caps how
 * far the playhead can be from the nearest decoded frame, so the ladder widens
 * with a longer run instead of getting coarser. The merged 421-frame pass sits
 * ~6 frames from its nearest waypoint; a fixed 24 would leave it ~9.
 */
const LADDER_MIN_STEPS = 24;
const LADDER_SPACING = 12;
/** Parallel image requests. Browsers cap at ~6 per host anyway. */
const LADDER_CONCURRENCY = 4;
const STREAM_CONCURRENCY = 6;
/** Give up on the very first frame after this long and fall back to the scene. */
const FIRST_FRAME_TIMEOUT = 8000;

function SequenceMedia({
  media,
  className,
  progressRef,
  fit,
  onFail,
}: {
  media: MediaConfig;
  className: string;
  progressRef?: RefObject<number>;
  fit: "cover" | "contain";
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
  /**
   * Where the contained poster's own top and bottom edges sit, as a percentage
   * of the stage — measured once from the still's real pixel size, so the
   * opening paint is feathered exactly where the canvas will feather it.
   */
  const [posterEdges, setPosterEdges] = useState<{ top: number; bottom: number } | null>(null);
  const reduced = usePrefersReducedMotion();

  const count = Math.max(1, Math.min(MAX_FRAMES, media.frameCount));

  /**
   * Paint frame `index` into the canvas: cover-fitted on wide stages, drawn
   * whole over an ambient field when covering would mean a heavy zoom.
   */
  const draw = (index: number, force = false) => {
    const canvas = canvasRef.current;
    const image = framesRef.current[index];
    if (!canvas || !image || !image.complete || !image.naturalWidth) return;

    /*
     * A phone backs a full-screen canvas at 1.5× instead of 2×. The portrait
     * frames are 640px wide, so the extra backing pixels were being invented
     * by the scaler anyway — and a 780 × 1688 fill per scrubbed frame was a
     * large part of what made the phone hero stutter.
     */
    const phone = window.innerWidth < 900;
    const dpr = Math.min(phone ? 1.5 : 2, window.devicePixelRatio || 1);
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

    const coverScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const fitScale = Math.min(width / image.naturalWidth, height / image.naturalHeight);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    /*
     * `contain` (the phone hero) or a frame so mismatched that covering it
     * would be mush: the whole picture, at the size it actually needs.
     *
     * The letterbox used to be filled with a blown-up copy of the frame, then
     * dimmed — and on a phone that read as a second, blurry hero: the run's own
     * wordmark duplicated above the fold, a hard black band where the sharp
     * frame started, and a visible rectangle around the picture. The stage's
     * own field is already behind this canvas, so the honest fix is to draw
     * nothing there at all and let that field show through. Only the picture's
     * own top and bottom edges are feathered into it, so the frame reads as
     * light on the page rather than as a photo pasted onto it.
     */
    if (fit === "contain" || coverScale > fitScale * MAX_COVER_ZOOM) {
      const fitWidth = image.naturalWidth * fitScale;
      const fitHeight = image.naturalHeight * fitScale;
      const top = (height - fitHeight) / 2;
      ctx.drawImage(image, (width - fitWidth) / 2, top, fitWidth, fitHeight);

      /*
       * Feather: erase the picture's first and last few dozen pixels with a
       * gradient, using `destination-out` so it subtracts coverage instead of
       * painting over it. One gradient fill per edge is cheap enough to run
       * inside the scrub, and it is what removes the seam the owner kept
       * seeing between the film and the page.
       */
      const band = Math.max(8, Math.min(Math.round(fitHeight * 0.04), 26));
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const topFade = ctx.createLinearGradient(0, top, 0, top + band);
      topFade.addColorStop(0, "rgba(0,0,0,1)");
      topFade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topFade;
      ctx.fillRect(0, top, width, band);
      const bottomFade = ctx.createLinearGradient(0, top + fitHeight - band, 0, top + fitHeight);
      bottomFade.addColorStop(0, "rgba(0,0,0,0)");
      bottomFade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, top + fitHeight - band, width, band);
      ctx.restore();

      drawnRef.current = index;
      return;
    }

    const drawWidth = image.naturalWidth * coverScale;
    const drawHeight = image.naturalHeight * coverScale;
    ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    drawnRef.current = index;
  };

  /**
   * Nearest frame that is actually decoded. Decoding the whole run takes a
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
        // bandwidth; the rest must never delay first paint.
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

      const steps = Math.max(LADDER_MIN_STEPS, Math.ceil(count / LADDER_SPACING));
      const step = Math.max(1, Math.ceil(count / steps));
      const ladder: number[] = [];
      for (let i = step; i < count; i += step) ladder.push(i);
      await runQueue(ladder, LADDER_CONCURRENCY);
      if (cancelled) return;

      const rest: number[] = [];
      for (let i = 0; i < count; i++) if (!ladder.includes(i) && i !== 0) rest.push(i);
      // Phones stream four at a time rather than six: the run is shorter, and
      // leaving a little bandwidth for the rest of the page is what keeps the
      // scroll smooth while frames are still arriving.
      await runQueue(rest, window.innerWidth < 900 ? 4 : STREAM_CONCURRENCY);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      // Drop every reference (and cancel anything still in flight) so a
      // route change does not leave the whole run pinned in memory.
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

  /** Feather the contained poster at the same margins its frame will have. */
  const measurePoster = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const stageRatio = image.clientWidth / Math.max(1, image.clientHeight);
    if (!image.naturalWidth || !image.naturalHeight) return;
    const pictureRatio = image.naturalWidth / image.naturalHeight;
    // The still is `contain`-fitted, so the shorter axis is the one that fills.
    const drawn = pictureRatio > stageRatio ? stageRatio / pictureRatio : 1;
    const margin = ((1 - drawn) / 2) * 100;
    setPosterEdges({ top: margin, bottom: 100 - margin });
  };

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
      {showPoster && media.poster && fit === "contain" ? (
        /*
         * The opening frame for a contained stage: the still itself, drawn
         * whole, with the same feathered edges the canvas uses — no blurred
         * copy behind it, because that copy is exactly the second ghost of the
         * hero the owner was seeing above and below the picture.
         */
        <img
          src={media.poster}
          alt=""
          aria-hidden="true"
          onLoad={measurePoster}
          className="absolute inset-0 h-full w-full object-contain"
          style={
            posterEdges
              ? (() => {
                  // The ramp crosses each edge, so the still's own first and
                  // last rows are faded exactly as the canvas fades them.
                  const band = 2.2;
                  const stops = `transparent ${Math.max(0, posterEdges.top - band).toFixed(1)}%, #000 ${(posterEdges.top + band).toFixed(1)}%, #000 ${(posterEdges.bottom - band).toFixed(1)}%, transparent ${Math.min(100, posterEdges.bottom + band).toFixed(1)}%`;
                  return {
                    maskImage: `linear-gradient(to bottom, ${stops})`,
                    WebkitMaskImage: `linear-gradient(to bottom, ${stops})`,
                  };
                })()
              : undefined
          }
          loading="eager"
          decoding="async"
        />
      ) : null}
      {showPoster && media.poster && fit !== "contain" ? (
        /*
         * The poster is the first frame, drawn exactly the way the canvas will
         * draw it: cover, filling the stage edge to edge. It used to be
         * letterboxed with an ambient field behind it, which meant the visit
         * opened on a small picture inside a visible border and then visibly
         * jumped to full size when the canvas took over. The opening frame is
         * now the final composition from the first paint.
         */
        <img
          src={media.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      ) : null}
    </div>
  );
}
