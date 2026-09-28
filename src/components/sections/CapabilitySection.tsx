import { useEffect, useRef } from "react";
import { capabilities } from "../../data/content";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";
import { RevealText } from "../common/Reveal";

/**
 * A quiet, three-column statement of what I actually do. It sits between the
 * pinned reel and the archive so the page breathes after the heaviest moment,
 * and each card lifts in real 3D on pointer move.
 */
export default function CapabilitySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = usePrefersReducedMotion();

  // Pointer-tracked tilt — one listener, rAF-free (CSS handles the easing).
  useEffect(() => {
    if (reduced) return;
    const cards = cardRefs.current.filter((c): c is HTMLDivElement => Boolean(c));
    if (!cards.length) return;

    const onMove = (e: PointerEvent) => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const near = Math.abs(x) < 1.2 && Math.abs(y) < 1.2;
        card.style.transform = near
          ? `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateZ(0)`
          : "perspective(900px) rotateY(0deg) rotateX(0deg)";
      });
    };
    const onLeave = () => {
      cards.forEach((card) => {
        card.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
      });
    };

    const section = sectionRef.current;
    section?.addEventListener("pointermove", onMove);
    section?.addEventListener("pointerleave", onLeave);
    return () => {
      section?.removeEventListener("pointermove", onMove);
      section?.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  // A hairline that draws itself across the section.
  useEffect(() => {
    if (reduced) return;
    const line = sectionRef.current?.querySelector("[data-rule]");
    if (!line) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id="capability"
      className="relative z-10 overflow-hidden bg-ink-950 py-24 md:py-32"
      aria-labelledby="capability-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">{capabilities.eyebrow}</span>
          <h2 id="capability-title" className="display text-[12vw] leading-[0.9] sm:text-6xl lg:text-7xl">
            {capabilities.title}
          </h2>
          <p className="max-w-[50ch] font-body text-base text-bone-muted">{capabilities.body}</p>
        </RevealText>

        <div data-rule className="mt-12 h-px w-full origin-left bg-bone/10 md:mt-16" />

        <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          {capabilities.items.map((item, i) => (
            <div
              key={item.key}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="group relative border border-bone/10 bg-ink-900/60 p-7 transition-[transform,border-color] duration-500 ease-silk will-change-transform hover:border-blood-700/50"
            >
              <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/70">
                {item.key}
              </span>
              <h3 className="display mt-6 text-2xl leading-tight text-bone">{item.title}</h3>
              <p className="mt-4 font-body text-sm leading-relaxed text-bone-dim transition-colors duration-500 group-hover:text-bone-muted">
                {item.body}
              </p>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-blood-600 to-transparent transition-transform duration-700 ease-silk group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
