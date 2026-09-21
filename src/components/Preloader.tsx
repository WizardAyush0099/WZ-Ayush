import { useEffect, useRef, useState } from "react";
import { hero } from "../data/content";
import { usePrefersReducedMotion } from "../lib/hooks";

export default function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(reduced ? 100 : 0);
  const [hidden, setHidden] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const body = document.body;
    body.style.overflow = "hidden";

    if (reduced) {
      setProgress(100);
      const t = window.setTimeout(() => finish(), 200);
      return () => {
        window.clearTimeout(t);
        // Never leave the page scroll-locked if this unmounts mid-flight.
        document.body.style.overflow = "";
      };
    }

    let raf = 0;
    const start = performance.now();
    const DURATION = 1500;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Safety net: release the scroll lock even if the reveal never finished.
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setProgress(100);
    window.setTimeout(() => {
      setHidden(true);
      document.body.style.overflow = "";
      onDone();
    }, 380);
  };

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-ink-950 transition-opacity duration-700 ease-silk"
      style={{ opacity: progress >= 100 ? 0 : 1, pointerEvents: progress >= 100 ? "none" : "auto" }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-6">
        <span className="font-accent text-[13px] tracking-[0.5em] text-blood-500/80">{hero.accent}</span>
        <h1 className="display text-[13vw] text-bone/90 sm:text-7xl">{hero.title}</h1>
        <div className="relative h-px w-[220px] overflow-hidden bg-bone/10 sm:w-[320px]">
          <div
            className="absolute inset-y-0 left-0 bg-blood-500"
            style={{ width: `${progress}%`, transition: "width 120ms linear" }}
          />
        </div>
        <span className="font-body text-[11px] tracking-cinematic text-bone-dim">
          {String(progress).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}
