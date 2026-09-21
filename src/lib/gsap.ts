import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once for the whole app (idempotent).
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
