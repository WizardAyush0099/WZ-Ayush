import { useEffect, useRef } from "react";
import { capabilities } from "../../data/content";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion, useSpotlight } from "../../lib/hooks";
import { RevealText } from "../common/Reveal";
import SplitReveal from "../fx/SplitReveal";

/**
 * A quiet, three-column statement of what I actually do. It sits right after
 * the pinned templates shelf so the page breathes after the heaviest moment,
 * and each card lifts in real 3D on pointer move.
 *
 * It carries two effects, both of them the owner's to switch off by editing the
 * card: the 3D lean (below, one listener for the row) and the light that follows
 * the pointer across the card (`useSpotlight`). The lean is written straight to
 * `style.transform` and the light to `style.setProperty`, so neither costs a
 * React render while the pointer moves — which is the only reason it is safe to
 * run both at once.
 */
export default function CapabilitySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = usePrefersReducedMotion();

  /** The light under the pointer, on both the cards and the heading rule. */
  useSpotlight(sectionRef);

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
      data-tune="sec-capability"
      className="relative z-10 overflow-hidden bg-ink-950 py-24 md:py-32"
      aria-labelledby="capability-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">{capabilities.eyebrow}</span>
          <SplitReveal
            as="h2"
            id="capability-title"
            text={capabilities.title}
            type="words"
            className="display text-[12vw] leading-[0.9] sm:text-6xl lg:text-7xl"
          />
          <p className="max-w-[50ch] font-body text-base text-bone-muted">{capabilities.body}</p>
        </RevealText>

        <div data-rule className="mt-12 h-px w-full origin-left bg-bone/10 md:mt-16" />

        <div data-tune="item-capability-grid" className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          {capabilities.items.map((item, i) => (
            <div
              key={item.key}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-spotlight
              className="spotlight halo group relative border border-bone/10 bg-ink-900/60 p-7 transition-[transform,border-color] duration-500 ease-silk will-change-transform hover:border-blood-700/50"
            >
              {/* The light that circles the frame on hover. */}
              <span className="halo-rim" aria-hidden="true" />

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
