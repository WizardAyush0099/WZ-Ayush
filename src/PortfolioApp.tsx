import { useCallback, useEffect, useState } from "react";
import { ScrollTrigger } from "./lib/gsap";
import { initSmoothScroll, scrollToId } from "./lib/scroll";
import { usePrefersReducedMotion } from "./lib/hooks";
import { useTheme } from "./lib/theme";
import { linkTo } from "./lib/router";
import type { SiteTemplate } from "./data/templates";
import { themesCta } from "./data/content";
import { LightboxProvider } from "./components/common/Lightbox";
import { RevealText } from "./components/common/Reveal";
import Atmosphere from "./components/fx/Atmosphere";
import CustomCursor from "./components/CustomCursor";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/hero/Hero";
import HeroIntro from "./components/sections/HeroIntro";
import StorySection from "./components/sections/StorySection";
import FeaturedWork from "./components/sections/FeaturedWork";
import LiveWebsites from "./components/sections/LiveWebsites";
import HorizontalGallery from "./components/sections/HorizontalGallery";
import CapabilitySection from "./components/sections/CapabilitySection";
import AboutSection from "./components/sections/AboutSection";
import GallerySection from "./components/sections/GallerySection";
import OrderSection from "./components/sections/OrderSection";
import FinalCTA from "./components/sections/FinalCTA";
import Footer from "./components/sections/Footer";

/**
 * ============================================================================
 *  THE HOMEPAGE — a cinematic portfolio that still sells
 * ============================================================================
 *  Order of business:
 *
 *    hero (film only) → intro → approach → featured work → live websites →
 *    reel → capability → about → archive → themes → brief → contact → footer
 *
 *  The work comes first and the commission comes last. The eight-step brief is
 *  on the page, but the twenty-concept template library is not — that lives on
 *  its own page at /#/builder, reached from the `themes` band below and from
 *  the hero, nav and closing CTAs. The brief is still self-sufficient: its
 *  template step lists the whole library inline.
 * ============================================================================
 */
export default function PortfolioApp() {
  const [ready, setReady] = useState(false);
  const reduced = usePrefersReducedMotion();

  // The visitor's palette and the template they are considering — both shared
  // between the Templates and Commissions sections.
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
        {/* The reel carries no words at all; the intro right below it holds
            the headline, the calls to action and the direct contact. */}
        <Hero ready={ready} />
        <HeroIntro />
        <StorySection />
        <FeaturedWork />
        <LiveWebsites />
        <HorizontalGallery />
        <CapabilitySection />
        <AboutSection />
        <GallerySection />

        {/* The library itself is on the themes page — this band is only the
            pointer to it, so the homepage stays about the work. */}
        <section
          id="themes"
          className="relative z-10 border-y border-bone/10 bg-ink-900 py-16 md:py-20"
          aria-labelledby="themes-title"
        >
          <div className="shell grid gap-8 md:grid-cols-12 md:items-end md:gap-12">
            <RevealText stagger className="flex flex-col gap-5 md:col-span-8">
              <span className="eyebrow">{themesCta.eyebrow}</span>
              <h2
                id="themes-title"
                className="display text-[11vw] leading-[0.92] text-bone sm:text-4xl lg:text-5xl"
              >
                {themesCta.title}
              </h2>
              <p className="max-w-[56ch] font-body text-base leading-relaxed text-bone-muted">
                {themesCta.body}
              </p>
            </RevealText>

            <div className="md:col-span-4 md:justify-self-end">
              <a
                href={linkTo("/builder")}
                data-cursor="hover"
                className="btn border-blood-600/70 bg-blood-600/15 px-7 py-4 text-[12px]"
              >
                {themesCta.action}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <OrderSection
          templateId={templateId}
          onSelectTemplate={selectTemplate}
          theme={theme}
          onSelectTheme={setTheme}
        />
        <FinalCTA />
      </main>

      <Footer />
    </LightboxProvider>
  );
}
