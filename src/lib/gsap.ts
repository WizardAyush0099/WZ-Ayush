import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

/**
 * ============================================================================
 *  GSAP — one registration, one import path
 * ============================================================================
 *  Three plugins live here, all of them free and all of them shipped inside the
 *  `gsap` package that was already a dependency:
 *
 *    ScrollTrigger        scroll-linked choreography (the hero's run, the
 *                         pinned shelf, every reveal on the page)
 *    SplitText            splits a headline into words, chars or lines — and,
 *                         with `mask`, gives each one a clipping wrapper, which
 *                         is what turns a fade into words rising out of a mask
 *    ScrambleTextPlugin   the decode: characters resolve out of noise, used on
 *                         hover for the wordmark and the footer wordmark
 *
 *  Since GSAP 3.13 the whole toolset — these included — is free for commercial
 *  use and published on the public npm package, so nothing here is a trial or a
 *  licence to track. Registering once keeps every component importing from one
 *  place, exactly as it already did for ScrollTrigger.
 * ============================================================================
 */

// Register once for the whole app (idempotent).
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
}

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin };
