import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";

type Blob = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  tint: [number, number, number];
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

    const build = () => {
      const tints: Array<[number, number, number]> = [
        [140, 20, 24],
        [90, 14, 18],
        [120, 108, 104],
        [60, 8, 10],
        [168, 132, 126],
      ];
      const count = window.innerWidth < 768 ? 4 : 6;
      blobs = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.min(width, height) * (0.28 + Math.random() * 0.34)) / 1.4,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.05 - Math.random() * 0.16,
        alpha: 0.05 + Math.random() * 0.06,
        tint: tints[i % tints.length],
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

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.y + b.r < -40) b.y = height + b.r;
        if (b.x + b.r < -40) b.x = width + b.r;
        if (b.x - b.r > width + 40) b.x = -b.r;

        const [r, g, bl] = b.tint;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${r},${g},${bl},${b.alpha})`);
        grad.addColorStop(0.55, `rgba(${r},${g},${bl},${b.alpha * 0.45})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
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
