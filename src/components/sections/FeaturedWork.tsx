import { useEffect, useRef, useState } from "react";
import { projects } from "../../data/content";
import { useHasFinePointer, usePrefersReducedMotion } from "../../lib/hooks";
import { useCrowCue } from "../../lib/useCrowCue";
import { RevealImage, RevealText } from "../common/Reveal";
import { useLightbox } from "../common/Lightbox";

export default function FeaturedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const hasFine = useHasFinePointer();
  const reduced = usePrefersReducedMotion();
  const { open } = useLightbox();
  useCrowCue(sectionRef, 12, "top 60%");

  // Cursor-following preview (desktop only).
  useEffect(() => {
    const el = previewRef.current;
    if (!el || !hasFine || reduced) return;

    const state = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2,
      w: el.offsetWidth,
      h: el.offsetHeight,
    };
    let raf = 0;

    const measure = () => {
      state.w = el.offsetWidth;
      state.h = el.offsetHeight;
    };
    const onMove = (e: MouseEvent) => {
      state.tx = e.clientX;
      state.ty = e.clientY;
    };
    const loop = () => {
      state.x += (state.tx - state.x) * 0.12;
      state.y += (state.ty - state.y) * 0.12;
      el.style.transform = `translate3d(${state.x - state.w / 2}px, ${state.y - state.h / 2}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("mousemove", onMove);
    };
  }, [hasFine, reduced]);

  const openProject = (i: number) => {
    const project = projects[i];
    // Projects with a link open the real thing; the rest open the image viewer.
    if (project.href) {
      window.open(project.href, "_blank", "noopener,noreferrer");
      return;
    }
    open(
      projects.map((p) => ({ src: p.image, alt: `${p.title} — ${p.category}`, caption: `${p.index} · ${p.title}` })),
      i,
    );
  };

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-ink-950 py-24 md:py-32 lg:py-40"
      aria-labelledby="work-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">Selected Work</span>
          <h2 id="work-title" className="display text-[12vw] leading-[0.9] sm:text-6xl lg:text-7xl">
            Featured
          </h2>
          <p className="max-w-[50ch] font-body text-base text-bone-muted">
            Four studies in restraint — each built to be felt before it is understood.
          </p>
        </RevealText>

        <ul className="mt-16 md:mt-20">
          {projects.map((p, i) => (
            <li key={p.index} className="border-t border-bone/10 last:border-b last:border-bone/10">
              <button
                type="button"
                onClick={() => openProject(i)}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                data-cursor="media"
                data-cursor-label={p.href ? "Open" : "View"}
                className="group block w-full py-8 text-left md:py-12"
                aria-label={p.href ? `Open ${p.title} (opens in a new tab)` : `View ${p.title} project image`}
              >
                <div className="grid items-center gap-6 md:grid-cols-12 md:gap-8">
                  <span className="col-span-1 font-body text-xs tracking-cinematic text-blood-500/70">
                    {p.index}
                  </span>

                  <div className="md:col-span-5">
                    <h3 className="display text-[8vw] leading-[0.95] text-bone transition-transform duration-700 ease-silk group-hover:translate-x-2 sm:text-4xl lg:text-5xl">
                      {p.title}
                    </h3>
                    <span className="mt-2 inline-block font-accent text-xs tracking-[0.4em] text-blood-500/60">
                      {p.accent}
                    </span>
                  </div>

                  <div className="md:col-span-4">
                    <p className="max-w-[38ch] font-body text-sm leading-relaxed text-bone-dim transition-colors duration-500 group-hover:text-bone-muted">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:col-span-2 md:justify-end">
                    <span className="flex items-center gap-2 font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      {p.category}
                      {p.href && (
                        <span aria-hidden="true" className="text-blood-500/80">
                          ↗
                        </span>
                      )}
                    </span>
                    <span className="h-px w-0 bg-blood-500 transition-all duration-700 ease-silk group-hover:w-10" />
                  </div>
                </div>

              </button>

              {/* Inline preview on touch/small screens (outside the button so
                  the markup stays valid — the row button above opens it). */}
              {!hasFine && (
                <div className="relative mb-8 md:hidden">
                  <RevealImage
                    src={p.image}
                    alt={`${p.title} — ${p.category}`}
                    variant="blur"
                    className="aspect-[16/10] w-full"
                  />
                  <button
                    type="button"
                    onClick={() => openProject(i)}
                    data-cursor="media"
                    data-cursor-label={p.href ? "Open" : "View"}
                    className="absolute inset-0 z-10"
                    aria-label={p.href ? `Open ${p.title} (opens in a new tab)` : `View ${p.title} project image`}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Floating preview — desktop only */}
      {hasFine && (
        <div
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[40]"
          style={{ willChange: "transform" }}
        >
          <div
            className="relative aspect-[4/5] w-[clamp(220px,26vw,360px)] overflow-hidden border border-bone/10 transition-[opacity,transform] duration-500 ease-silk"
            style={{
              opacity: active === null ? 0 : 1,
              transform: active === null ? "scale(0.9)" : "scale(1)",
              boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
            }}
          >
            {projects.map((p, i) => (
              <img
                key={p.index}
                src={p.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-silk"
                style={{ opacity: active === i ? 1 : 0 }}
              />
            ))}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink-950/90 to-transparent px-4 pb-3 pt-10 font-body text-[10px] uppercase tracking-wide2 text-bone/80">
              <span>{active !== null ? projects[active].title : ""}</span>
              <span className="text-blood-400">View</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
