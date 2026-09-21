import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { CROWS_EVENT } from "../../lib/fx";

type Crow = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  flap: number;
  flapSpeed: number;
  alpha: number;
  life: number;
  maxLife: number;
};

/** Draws a single stylised crow silhouette with animated wings. */
function drawCrow(ctx: CanvasRenderingContext2D, c: Crow) {
  const w = c.size;
  const h = c.size * (0.42 + Math.sin(c.flap) * 0.34);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.vx < 0 ? -1 : 1, 1);
  ctx.globalAlpha = c.alpha;
  ctx.fillStyle = "#0b0709";
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.quadraticCurveTo(-w * 0.42, -h * 1.5, 0, 0);
  ctx.quadraticCurveTo(w * 0.42, -h * 1.5, w, 0);
  ctx.quadraticCurveTo(w * 0.4, h * 0.5, 0, h * 0.18);
  ctx.quadraticCurveTo(-w * 0.4, h * 0.5, -w, 0);
  ctx.closePath();
  ctx.fill();
  // Faint red rim so crows read against pure black.
  ctx.globalAlpha = c.alpha * 0.35;
  ctx.strokeStyle = "#b31115";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Crow/feather particle layer used for cinematic section transitions. */
export default function CrowCanvas() {
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
    const crows: Crow[] = [];
    const MAX = 90;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnOne = (fromLeft?: boolean) => {
      if (crows.length >= MAX) return;
      const left = fromLeft ?? Math.random() > 0.5;
      const speed = 1.4 + Math.random() * 2.6;
      const maxLife = 8 + Math.random() * 5;
      crows.push({
        x: left ? -80 : width + 80,
        y: height * (0.08 + Math.random() * 0.72),
        vx: left ? speed : -speed,
        vy: (Math.random() - 0.5) * 0.5,
        size: 9 + Math.random() * 22,
        flap: Math.random() * Math.PI * 2,
        flapSpeed: 0.06 + Math.random() * 0.1,
        alpha: 0,
        life: 0,
        maxLife,
      });
    };

    const onBurst = (e: Event) => {
      const detail = (e as CustomEvent<{ count?: number }>).detail;
      const n = detail?.count ?? 14;
      for (let i = 0; i < n; i++) {
        setTimeout(() => spawnOne(), (i / n) * 420);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = crows.length - 1; i >= 0; i--) {
        const c = crows[i];
        c.life += 1 / 60;
        c.x += c.vx;
        c.y += c.vy + Math.sin(c.life * 1.4) * 0.12;
        c.flap += c.flapSpeed;
        const t = c.life / c.maxLife;
        c.alpha = t < 0.2 ? t / 0.2 : t > 0.7 ? (1 - t) / 0.3 : 1;

        if (t >= 1 || c.x < -160 || c.x > width + 160) {
          crows.splice(i, 1);
          continue;
        }
        drawCrow(ctx, c);
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
    window.addEventListener(CROWS_EVENT, onBurst);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener(CROWS_EVENT, onBurst);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;

  return <canvas ref={canvasRef} aria-hidden="true" className="fx-layer" style={{ zIndex: 47 }} />;
}
