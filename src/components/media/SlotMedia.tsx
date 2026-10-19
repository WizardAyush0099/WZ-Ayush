import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ImageSlot, SlotFilm } from "../../data/imageSlots";
import { slotPointId } from "../../data/tunePoints";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { acquireRun, frameUrlIn, nearestDecoded } from "./frameRun";

/**
 * ============================================================================
 *  SLOT MEDIA — one picture, drawn the way the dashboard says
 * ============================================================================
 *  Every frame on the page that comes from the section-wise image manager is
 *  rendered by this component, so each property the owner sets is applied in
 *  exactly one place:
 *
 *    src / film   a still (`<img>`) or a numbered run scrubbed by scroll — the
 *                 same mechanic the hero's opening reel uses, so a tile can
 *                 hold a 3D scroll animation instead of a flat picture
 *    animation    film (scrub only), reveal (mask + blur-to-sharp), parallax
 *                 (drift while it crosses), zoom (push-in), fade, or still
 *    opacity      how strongly the picture itself is drawn
 *    blur         a soft, blurred copy of the picture behind the frame
 *    background   the colour painted behind the frame
 *    width/height the frame's size, as a percentage of its column and,
 *                 optionally, a pixel height
 *    zoom        1 … 4 — how far the picture is enlarged inside its frame,
 *                 which is what crops it; a film crops identically, because
 *                 the canvas draws with the same scale
 *    posX/posY   0 … 100 — which part of the picture survives that crop
 *    radius      rounded corners on the frame
 *
 *  The frame keeps `overflow-hidden`, which is what makes the reveal mask and
 *  the blurred backdrop work, and a film only ever loads one shared copy of
 *  its run however many slots point at it (see `frameRun.ts`).
 * ============================================================================
 */

type SlotMediaProps = {
  slot: ImageSlot;
  /** Classes for the frame box — where width, height and background land. */
  className?: string;
  /** Classes for the picture itself (`object-cover`, hover zoom, …). */
  mediaClassName?: string;
  /** Aspect class used when the slot does not pin a pixel height. */
  aspect?: string;
  /** Draw straight away instead of waiting for the viewport. */
  eager?: boolean;
};

export default function SlotMedia({
  slot,
  className = "",
  mediaClassName = "",
  aspect = "aspect-[4/5]",
  eager = false,
}: SlotMediaProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  /** The still the slot shows before its film has decoded anything. */
  const poster = slot.src || (slot.film ? frameUrlIn(slot.film, 0) : "");

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || reduced) return;
    // `film` scrubs with scroll and `still` does nothing — both are already
    // the whole animation.
    if (slot.animation === "film" || slot.animation === "still") return;

    const ctx = gsap.context(() => {
      if (slot.animation === "reveal") {
        gsap.fromTo(
          frame,
          { clipPath: "inset(0% 0% 100% 0%)", scale: 1.1, filter: "blur(14px)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            filter: "blur(0px)",
            duration: 1.9,
            ease: "power3.out",
            scrollTrigger: { trigger: frame, start: "top 88%", once: true },
          },
        );
        return;
      }

      if (slot.animation === "parallax") {
        gsap.fromTo(
          frame,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        );
        return;
      }

      if (slot.animation === "zoom") {
        gsap.fromTo(
          frame,
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        );
        return;
      }

      gsap.fromTo(
        frame,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: frame, start: "top 92%", once: true },
        },
      );
    }, frame);

    return () => ctx.revert();
  }, [slot.animation, reduced]);

  const style: CSSProperties = {
    width: `${slot.width}%`,
    background: slot.background || undefined,
    ...(slot.height > 0 ? { height: `${slot.height}px` } : {}),
    ...(slot.radius > 0 ? { borderRadius: `${slot.radius}px` } : {}),
  };

  /**
   * The crop: which part of the still the frame keeps, and how far it is
   * enlarged inside it. Only written when the owner has moved something, so an
   * untouched slot keeps the frame's own hover/scale classes intact.
   */
  const stillStyle: CSSProperties | undefined =
    slot.zoom === 1 && slot.posX === 50 && slot.posY === 50
      ? undefined
      : {
          objectPosition: `${slot.posX}% ${slot.posY}%`,
          ...(slot.zoom !== 1 ? { transform: `scale(${slot.zoom})` } : {}),
        };

  return (
    <div
      ref={frameRef}
      // The Studio tab reaches every picture through this attribute; the slot's
      // own id is what the Images tab edits.
      data-tune={slotPointId(slot.section, slot.index)}
      className={`relative overflow-hidden ${slot.height > 0 ? "" : aspect} ${className}`}
      style={style}
    >
      {/* The blurred backdrop: the same picture, held well back. */}
      {poster && slot.blur > 0 ? (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover"
          style={{ filter: `blur(${slot.blur}px)`, opacity: Math.min(1, slot.opacity) }}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      ) : null}

      <div className="relative h-full w-full" style={{ opacity: slot.opacity }}>
        {slot.film ? (
          <FilmCanvas
            film={slot.film}
            from={slot.filmFrom}
            to={slot.filmTo}
            poster={poster}
            ready={eager}
            mediaClassName={mediaClassName}
            reduced={reduced}
            zoom={slot.zoom}
            posX={slot.posX}
            posY={slot.posY}
          />
        ) : slot.src ? (
          <img
            src={slot.src}
            alt={slot.alt || slot.caption}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={`h-full w-full object-cover ${mediaClassName}`}
            style={stillStyle}
          />
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  The scroll film                                                           */
/* -------------------------------------------------------------------------- */

/**
 * A numbered run, painted on a canvas and scrubbed by this element's own
 * travel through the viewport: the first frame when the tile's top reaches the
 * bottom of the screen, the last as its bottom leaves the top. `from`/`to`
 * pick which passage of the shared run this slot plays, so six tiles over one
 * run read as six different moments rather than six copies.
 */
function FilmCanvas({
  film,
  from,
  to,
  poster,
  ready,
  mediaClassName,
  reduced,
  zoom,
  posX,
  posY,
}: {
  film: SlotFilm;
  from: number;
  to: number;
  poster: string;
  ready: boolean;
  mediaClassName: string;
  reduced: boolean;
  /** 1 … 4 — how far into the frame the film is drawn (crops it). */
  zoom: number;
  /** 0 … 100 — which slice of the frame survives that crop. */
  posX: number;
  posY: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef(-1);
  const [painted, setPainted] = useState(false);

  const run = useMemo(() => acquireRun(film), [film.dir, film.count, film.ext]);

  /** Frame index for a 0 → 1 position inside this slot's window. */
  const frameAt = (progress: number) => {
    const start = Math.round(from * (run.count - 1));
    const end = Math.round(to * (run.count - 1));
    return Math.max(0, Math.min(run.count - 1, Math.round(start + progress * (end - start))));
  };

  const paint = (index: number, force = false) => {
    const canvas = canvasRef.current;
    const image = run.images[index];
    if (!canvas || !image || !image.complete || !image.naturalWidth) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;

    const backingWidth = Math.round(width * dpr);
    const backingHeight = Math.round(height * dpr);
    const resized = canvas.width !== backingWidth || canvas.height !== backingHeight;
    if (drawnRef.current === index && !resized && !force) return;
    if (resized) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    /*
     * Cover, then the slot's own crop on top of it: `zoom` enlarges the frame
     * inside the tile exactly the way an `<img>` with `object-fit: cover` plus
     * a scale would, and `posX`/`posY` pick which part of it is kept — 50/50 is
     * the centre, i.e. the committed framing.
     */
    const scale =
      Math.max(width / image.naturalWidth, height / image.naturalHeight) * Math.max(1, zoom);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      image,
      (width - drawWidth) * (posX / 100),
      (height - drawHeight) * (posY / 100),
      drawWidth,
      drawHeight,
    );
    drawnRef.current = index;
    setPainted(true);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // A crop change keeps the frame index but changes every pixel, so the
    // “already drawn” shortcut has to start over.
    drawnRef.current = -1;
    if (reduced) {
      paint(frameAt(0.5), true);
      return;
    }

    let raf = 0;
    /**
     * Frames keep streaming in after the first paint, so something has to ask
     * for a repaint as they land. This interval does that and then stops
     * itself the moment the run is complete — a tile that has finished loading
     * must not keep waking up four times a second to measure itself.
     */
    let tick = 0;
    const update = () => {
      raf = 0;
      const rect = host.getBoundingClientRect();
      const travel = rect.height + window.innerHeight;
      const progress = travel > 0 ? (window.innerHeight - rect.top) / travel : 0;
      const index = frameAt(Math.max(0, Math.min(1, progress)));
      paint(index >= 0 ? (run.decoded[index] ? index : nearestDecoded(run, index)) : index);
      if (tick && run.complete()) {
        window.clearInterval(tick);
        tick = 0;
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const unsubscribe = run.subscribe(() => {
      drawnRef.current = -1;
      schedule();
    });
    if (!run.complete()) tick = window.setInterval(schedule, 240);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (tick) window.clearInterval(tick);
      unsubscribe();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, from, to, reduced, zoom, posX, posY]);

  return (
    <div ref={hostRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`h-full w-full ${mediaClassName}`}
        style={{ opacity: painted ? 1 : 0, transition: "opacity 700ms cubic-bezier(0.16,1,0.3,1)" }}
      />
      {poster && !painted ? (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover ${mediaClassName}`}
          loading={ready ? "eager" : "lazy"}
          decoding="async"
        />
      ) : null}
    </div>
  );
}
