import { useCallback, useEffect, useState } from "react";
import { ScrollTrigger } from "./lib/gsap";
import { initSmoothScroll, scrollToId } from "./lib/scroll";
import { usePrefersReducedMotion } from "./lib/hooks";
import { useTheme } from "./lib/theme";
import type { SiteTemplate } from "./data/content";
import { LightboxProvider } from "./components/common/Lightbox";
import Atmosphere from "./components/fx/Atmosphere";
import CustomCursor from "./components/CustomCursor";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/hero/Hero";
import StorySection from "./components/sections/StorySection";
import FeaturedWork from "./components/sections/FeaturedWork";
import HorizontalGallery from "./components/sections/HorizontalGallery";
import CapabilitySection from "./components/sections/CapabilitySection";
import AboutSection from "./components/sections/AboutSection";
import GallerySection from "./components/sections/GallerySection";
import TemplatesSection from "./components/sections/TemplatesSection";
import OrderSection from "./components/sections/OrderSection";
import FinalCTA from "./components/sections/FinalCTA";
import Footer from "./components/sections/Footer";

/** The public, scroll-driven portfolio. Mounted only on non-admin routes. */
export default function PortfolioApp() {
  const [ready, setReady] = useState(false);
  const reduced = usePrefersReducedMotion();

  // The visitor's palette and the template they are considering — both shared
  // between the Templates and Order sections.
  const [theme, setTheme] = useTheme();
  const [templateId, setTemplateId] = useState<string | null>(null);

  const selectTemplate = useCallback(
    (template: SiteTemplate) => {
      setTemplateId(template.id);
      setTheme(template.theme);
      window.setTimeout(() => scrollToId("order"), 140);
    },
    [setTheme],
  );

  // Smooth scrolling (skipped entirely for reduced-motion users).
  useEffect(() => initSmoothScroll(!reduced), [reduced]);

  // Recalculate scroll positions once the hero has been revealed, and again
  // after all imagery has loaded (image heights affect pinning).
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 140);
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
        <TemplatesSection
          activeTemplateId={templateId}
          onSelectTemplate={selectTemplate}
          theme={theme}
          onSelectTheme={setTheme}
        />
        <OrderSection templateId={templateId} theme={theme} />
        <HorizontalGallery />
        <CapabilitySection />
        <AboutSection />
        <GallerySection />
        <FinalCTA />
      </main>

      <Footer />
    </LightboxProvider>
  );
}
