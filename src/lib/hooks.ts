import { useEffect, useState } from "react";

/** Subscribe to a media query. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** True when the user asks for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on touch/coarse-pointer devices (no hover). */
export function useIsTouch(): boolean {
  return useMediaQuery("(hover: none), (pointer: coarse)");
}

/** True when a precise pointer is available (desktop). */
export function useHasFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** Rough device capability tier used to scale particle counts / effects. */
export function useDeviceTier(): "low" | "mid" | "high" {
  const isTouch = useIsTouch();
  const [tier, setTier] = useState<"low" | "mid" | "high">("mid");

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    if (isTouch && (cores <= 4 || memory <= 3)) setTier("low");
    else if (isTouch) setTier("mid");
    else if (cores >= 8) setTier("high");
    else setTier("mid");
  }, [isTouch]);

  return tier;
}
