import { useEffect, useRef, useState } from "react";
import { projects } from "../../data/content";
import { useHasFinePointer, usePrefersReducedMotion } from "../../lib/hooks";
import { RevealImage, RevealText } from "../common/Reveal";
import { useLightbox } from "../common/Lightbox";

/**
 * Featured work — four rows, one per product. On desktop the row is joined by
 * a cursor-following preview card; on touch the preview is inline so nothing
 * is hidden behind a hover that never happens.
 */
export default function FeaturedWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const hasFine = useHasFinePointer();
  const reduced = usePrefersReducedMotion();
  const { open } = useLightbox();

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
      state.x += (state.tx - state.x) * 0.11;
      state.y += (state.ty - state.y) * 0.11;
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
      className="relative z-10 overflow-hidden bg-ink-950 py-24 md:py-28 lg:py-32"
      aria-labelledby="work-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">Selected Work</span>
          <h2 id="work-title" className="display text-[12vw] leading-[0.9] sm:text-6xl lg:text-7xl">
            Featured
          </h2>
          <p className="max-w-[52ch] font-body text-base text-bone-muted">
            Study Hub and the three flagship pages that carry it — each built to be felt before
            it is understood.
          </p>
        </RevealText>

        <ul className="mt-16 md:mt-20">
          {projects.map((p, i) => (
            <li
              key={p.index}
              className={`border-t border-bone/10 transition-colors duration-700 ease-silk last:border-b ${
                active === i ? "border-blood-800/50" : "border-bone/10"
              }`}
            >
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
                aria-label={p.href ? `Open ${p.title} (opens in a new tab)` : `View ${p.title}`}
              >
                <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8">
                  <span className="col-span-1 font-body text-xs tracking-cinematic text-blood-500/70">
                    {p.index}
                  </span>

                  <div className="md:col-span-5">
                    <h3 className="display text-[8vw] leading-[0.95] text-bone transition-transform duration-700 ease-silk group-hover:translate-x-2 sm:text-4xl lg:text-5xl">
                      {p.title}
                    </h3>
                    <span className="mt-3 flex items-center gap-3">
                      <span className="font-accent text-xs tracking-[0.4em] text-blood-500/60">
                        {p.accent}
                      </span>
                      <span className="h-px w-6 bg-bone/20" aria-hidden="true" />
                      <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        {p.category}
                      </span>
                    </span>
                  </div>

                  <div className="md:col-span-4">
                    <p className="max-w-[42ch] font-body text-sm leading-relaxed text-bone-dim transition-colors duration-500 group-hover:text-bone-muted">
                      {p.description}
                    </p>
                    <ul className="mt-5 hidden flex-col gap-2 md:flex">
                      {p.highlights.map((h) => (
                        <li key={h} className="flex gap-2.5 font-body text-[12px] leading-relaxed text-bone-dim/80">
                          <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-blood-600/80" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:col-span-2 md:justify-end">
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        className="border border-bone/10 px-2.5 py-1 font-body text-[9px] uppercase tracking-wide2 text-bone-dim transition-colors duration-500 group-hover:border-bone/20 group-hover:text-bone-muted"
                      >
                        {s}
                      </span>
                    ))}
                    <span
                      aria-hidden="true"
                      className="ml-2 text-blood-500/80 transition-transform duration-700 ease-silk group-hover:translate-x-1"
                    >
                      {p.href ? "↗" : "→"}
                    </span>
                  </div>
                </div>
              </button>

              {/* Inline preview on touch/small screens — outside the row button
                  so the markup stays valid. */}
              {!hasFine && (
                <div className="relative mb-8 md:hidden">
                  <RevealImage
                    src={p.image}
                    alt={`${p.title} — ${p.category}`}
                    variant="blur"
                    className="aspect-[16/10] w-full border border-bone/10"
                  />
                  <button
                    type="button"
                    onClick={() => openProject(i)}
                    data-cursor="media"
                    data-cursor-label={p.href ? "Open" : "View"}
                    className="absolute inset-0 z-10"
                    aria-label={p.href ? `Open ${p.title} (opens in a new tab)` : `View ${p.title}`}
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
            className="relative aspect-[4/5] w-[clamp(240px,26vw,380px)] overflow-hidden border border-bone/10 transition-[opacity,transform] duration-500 ease-silk"
            style={{
              opacity: active === null ? 0 : 1,
              transform: active === null ? "scale(0.92) rotate(-2deg)" : "scale(1) rotate(0deg)",
              boxShadow: "0 40px 110px rgba(0,0,0,0.7)",
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
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink-950/95 via-ink-950/50 to-transparent px-4 pb-3 pt-12 font-body text-[10px] uppercase tracking-wide2 text-bone/80">
              <span>{active !== null ? projects[active].title : ""}</span>
              <span className="text-blood-400">{active !== null ? projects[active].accent : ""}</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
