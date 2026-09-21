import { useEffect, useRef } from "react";
import type { ElementType, ReactNode, Ref } from "react";
import { gsap } from "../../lib/gsap";
import { usePrefersReducedMotion } from "../../lib/hooks";

type TextProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Animate direct children individually with a stagger. */
  stagger?: boolean;
  delay?: number;
  y?: number;
};

/** Fade + rise a block (or its children) into view on scroll. */
export function RevealText({
  as: Tag = "div",
  children,
  className,
  stagger = false,
  delay = 0,
  y = 36,
}: TextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const targets: gsap.TweenTarget = stagger ? Array.from(el.children) : el;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 1.05,
        ease: "power3.out",
        delay,
        stagger: stagger ? 0.12 : 0,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [stagger, delay, y, reduced]);

  return (
    <Tag ref={ref as Ref<never>} className={className}>
      {children}
    </Tag>
  );
}

type ImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** "mask" = clip reveal, "blur" = blur-to-sharp, "scale" = gentle scale-in. */
  variant?: "mask" | "blur" | "scale";
  eager?: boolean;
};

/** Premium image reveal — clip-path mask + blur-to-sharp + scale settle. */
export function RevealImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  variant = "mask",
  eager = false,
}: ImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img || reduced) return;

    const from: gsap.TweenVars = { scale: 1.14, filter: "blur(16px)" };
    if (variant === "mask") from.clipPath = "inset(0% 0% 100% 0%)";
    if (variant === "scale") from.scale = 0.92;

    const to: gsap.TweenVars = {
      scale: 1,
      filter: "blur(0px)",
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.35,
      ease: "power3.out",
      scrollTrigger: { trigger: wrap, start: "top 88%", once: true },
    };

    const ctx = gsap.context(() => {
      if (variant === "mask") gsap.set(wrap, { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.fromTo(img, from, to);
    }, wrap);

    return () => ctx.revert();
  }, [variant, reduced]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`h-full w-full object-cover ${imgClassName}`}
        style={{ willChange: "transform, filter" }}
      />
    </div>
  );
}
