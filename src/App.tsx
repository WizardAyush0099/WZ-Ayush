import { useEffect, useState } from "react";
import { ScrollTrigger } from "./lib/gsap";
import { initSmoothScroll } from "./lib/scroll";
import { usePrefersReducedMotion } from "./lib/hooks";
import { LightboxProvider } from "./components/common/Lightbox";
import Atmosphere from "./components/fx/Atmosphere";
import CustomCursor from "./components/CustomCursor";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/hero/Hero";
import StorySection from "./components/sections/StorySection";
import FeaturedWork from "./components/sections/FeaturedWork";
import HorizontalGallery from "./components/sections/HorizontalGallery";
import AboutSection from "./components/sections/AboutSection";
import GallerySection from "./components/sections/GallerySection";
import FinalCTA from "./components/sections/FinalCTA";
import Footer from "./components/sections/Footer";

export default function App() {
  const [ready, setReady] = useState(false);
  const reduced = usePrefersReducedMotion();

  // Smooth scrolling (skipped entirely for reduced-motion users).
  useEffect(() => initSmoothScroll(!reduced), [reduced]);

  // Recalculate scroll positions once the hero has been revealed, and again
  // after all imagery has loaded (image heights affect pinning).
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("load", onLoad);
    };
  }, [ready]);

  return (
    <LightboxProvider>
      <Preloader onDone={() => setReady(true)} />
      <Atmosphere />
      <CustomCursor />
      <Navbar ready={ready} />

      <main>
        <Hero ready={ready} />
        <StorySection />
        <FeaturedWork />
        <HorizontalGallery />
        <AboutSection />
        <GallerySection />
        <FinalCTA />
      </main>

      <Footer />
    </LightboxProvider>
  );
}
