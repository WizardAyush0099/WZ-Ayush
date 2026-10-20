import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";

type Blob = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  /** Index into the pre-rendered sprites — one per tint. */
  tint: number;
};

/**
 * Volumetric haze — a handful of large, very soft blobs drifting behind the
 * hero subject. Cheap (one canvas, no blur filters) but adds the "lit smoke"
 * depth that flat gradients can't.
 */
export default function FogCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let blobs: Blob[] = [];
    /** Last paint timestamp — the haze drifts, so 30fps is indistinguishable. */
    let lastFrame = 0;

    const TINTS: Array<[number, number, number]> = [
      [140, 20, 24],
      [90, 14, 18],
      [120, 108, 104],
      [60, 8, 10],
      [168, 132, 126],
    ];

    /**
     * One 128px radial-gradient sprite per tint, made once.
     *
     * The haze used to call `createRadialGradient` six times per frame — a
     * gradient object plus a full-canvas path fill, every 16ms, on top of the
     * hero's own frame draw. On a laptop that showed up as scroll jitter. Now
     * the soft blob is a bitmap and painting it is one `drawImage`.
     */
    let sprites: HTMLCanvasElement[] = [];

    const makeSprites = () => {
      sprites = TINTS.map(([r, g, b]) => {
        const size = 128;
        const sprite = document.createElement("canvas");
        sprite.width = size;
        sprite.height = size;
        const sctx = sprite.getContext("2d");
        if (!sctx) return sprite;
        const grad = sctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
        grad.addColorStop(0.55, `rgba(${r},${g},${b},0.45)`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, size, size);
        return sprite;
      });
    };

    const build = () => {
      const count = window.innerWidth < 768 ? 4 : 6;
      blobs = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.min(width, height) * (0.28 + Math.random() * 0.34)) / 1.4,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.05 - Math.random() * 0.16,
        alpha: 0.05 + Math.random() * 0.06,
        tint: i % TINTS.length,
      }));
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.round(rect?.width ?? window.innerWidth));
      height = Math.max(1, Math.round(rect?.height ?? window.innerHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const draw = (time = 0) => {
      if (time - lastFrame < 32) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.y + b.r < -40) b.y = height + b.r;
        if (b.x + b.r < -40) b.x = width + b.r;
        if (b.x - b.r > width + 40) b.x = -b.r;

        const sprite = sprites[b.tint];
        if (!sprite) continue;
        ctx.globalAlpha = b.alpha;
        ctx.drawImage(sprite, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (running) raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    makeSprites();
    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
