import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";

type Ember = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
};

/**
 * Rising red embers rendered on a single fixed canvas.
 * Count scales with viewport width; pauses when the tab is hidden or the
 * user prefers reduced motion.
 */
export default function EmberCanvas({ density = 1 }: { density?: number }) {
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

    const embers: Ember[] = [];

    const targetCount = () => {
      const w = window.innerWidth;
      const base = w < 640 ? 22 : w < 1024 ? 40 : 68;
      return Math.round(base * density);
    };

    const spawn = (initial = false): Ember => {
      const life = 6 + Math.random() * 9;
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + Math.random() * 60,
        r: 0.5 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -(0.12 + Math.random() * 0.42),
        life: initial ? Math.random() * life : 0,
        maxLife: life,
        hue: 2 + Math.random() * 16,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = targetCount();
      while (embers.length < count) embers.push(spawn(true));
      embers.length = count;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life += 1 / 60;
        e.x += e.vx;
        e.y += e.vy;
        e.vx += (Math.random() - 0.5) * 0.004;

        // Fade in / out across the ember's lifetime.
        const t = e.life / e.maxLife;
        const alpha = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;
        if (t >= 1 || e.y < -40) {
          embers[i] = spawn(false);
          continue;
        }

        const flicker = 0.75 + Math.sin(e.life * 6 + e.x) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${e.hue}, 88%, 58%, ${0.42 * alpha * flicker})`;
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();

        // Soft halo on the larger, closer embers only.
        if (e.r > 1.4) {
          ctx.beginPath();
          ctx.fillStyle = `hsla(${e.hue}, 90%, 50%, ${0.08 * alpha})`;
          ctx.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
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
  }, [reduced, density]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fx-layer"
      style={{ zIndex: 45, opacity: 0.9 }}
    />
  );
}
