import { useEffect, useRef } from "react";
import { useHasFinePointer, usePrefersReducedMotion } from "../lib/hooks";

type Variant = "default" | "hover" | "media";

const SIZES: Record<Variant, number> = { default: 12, hover: 46, media: 82 };

/**
 * Interpolated custom cursor — desktop (fine pointer) only.
 * Elements opt in with `data-cursor="hover"` or
 * `data-cursor="media" data-cursor-label="View"`.
 */
export default function CustomCursor() {
  const fine = useHasFinePointer();
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("custom-cursor");

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2,
      size: SIZES.default,
      tSize: SIZES.default,
      opacity: 0,
      tOpacity: 0,
      variant: "default" as Variant,
    };

    let raf = 0;

    const applyVariant = (variant: Variant, label?: string) => {
      state.variant = variant;
      state.tSize = SIZES[variant];
      const ring = ringRef.current;
      if (ring) {
        ring.style.borderColor =
          variant === "default" ? "rgba(236,231,225,0.5)" : "rgba(214,31,38,0.9)";
        ring.style.backgroundColor =
          variant === "media" ? "rgba(179,17,21,0.16)" : "transparent";
      }
      if (labelRef.current) {
        labelRef.current.textContent = label ?? "";
        labelRef.current.style.opacity = variant === "media" && label ? "1" : "0";
      }
      if (dotRef.current) {
        dotRef.current.style.opacity = variant === "default" ? "1" : "0";
      }
    };

    const onMove = (e: MouseEvent) => {
      state.tx = e.clientX;
      state.ty = e.clientY;
      state.tOpacity = 1;
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor], a, button, input, textarea, select, [role='button']",
      ) as HTMLElement | null;
      if (!el) {
        applyVariant("default");
        return;
      }
      const explicit = el.getAttribute("data-cursor") as Variant | null;
      if (explicit === "media") applyVariant("media", el.getAttribute("data-cursor-label") ?? "View");
      else if (explicit) applyVariant(explicit);
      else applyVariant("hover");
    };

    const onOut = (e: MouseEvent) => {
      const to = (e.relatedTarget as HTMLElement | null)?.closest?.(
        "[data-cursor], a, button, input, textarea, select, [role='button']",
      );
      if (!to) applyVariant("default");
    };

    const onLeave = () => (state.tOpacity = 0);
    const onDown = () => (state.tSize = state.variant === "default" ? 8 : SIZES[state.variant] * 0.82);
    const onUp = () => (state.tSize = SIZES[state.variant]);

    const loop = () => {
      state.x += (state.tx - state.x) * 0.18;
      state.y += (state.ty - state.y) * 0.18;
      state.size += (state.tSize - state.size) * 0.16;
      state.opacity += (state.tOpacity - state.opacity) * 0.14;

      const wrap = wrapRef.current;
      const ring = ringRef.current;
      if (wrap) {
        wrap.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
        wrap.style.opacity = String(state.opacity);
      }
      if (ring) {
        ring.style.width = `${state.size}px`;
        ring.style.height = `${state.size}px`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("custom-cursor");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[95]"
      style={{ willChange: "transform, opacity" }}
    >
      <div
        ref={ringRef}
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border transition-colors duration-300 ease-silk"
        style={{
          width: SIZES.default,
          height: SIZES.default,
          transform: "translate(-50%, -50%)",
          willChange: "width, height",
        }}
      >
        <span
          ref={labelRef}
          className="select-none font-body text-[10px] font-medium uppercase tracking-wide2 text-bone opacity-0 transition-opacity duration-200"
        />
        <div
          ref={dotRef}
          className="absolute rounded-full bg-bone transition-opacity duration-200"
          style={{ width: 4, height: 4, transform: "translate(-50%, -50%)", left: "50%", top: "50%" }}
        />
      </div>
    </div>
  );
}
