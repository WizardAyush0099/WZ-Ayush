import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { setSelectedTemplate, useSelectedTemplateId } from "./lib/builderSelection";
import { ScrollTrigger } from "./lib/gsap";
import { initSmoothScroll, scrollToId } from "./lib/scroll";
import { usePrefersReducedMotion } from "./lib/hooks";
import { useTheme } from "./lib/theme";
import { useSiteData } from "./lib/siteData";
import { isSectionHidden, stagesIn } from "./lib/studio";
import { linkTo } from "./lib/router";
import type { SiteTemplate } from "./data/templates";
import { themesCta } from "./data/content";
import { LightboxProvider } from "./components/common/Lightbox";
import { RevealText } from "./components/common/Reveal";
import Atmosphere from "./components/fx/Atmosphere";
import ScrollProgress from "./components/fx/ScrollProgress";
import CustomCursor from "./components/CustomCursor";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/hero/Hero";
import HeroIntro from "./components/sections/HeroIntro";
import StorySection from "./components/sections/StorySection";
import StatementBand from "./components/sections/StatementBand";
import HorizontalGallery from "./components/sections/HorizontalGallery";
import CapabilitySection from "./components/sections/CapabilitySection";
import AboutSection from "./components/sections/AboutSection";
import GallerySection from "./components/sections/GallerySection";
import LiveProjects from "./components/sections/LiveProjects";
import OrderSection from "./components/sections/OrderSection";
import FinalCTA from "./components/sections/FinalCTA";
import Footer from "./components/sections/Footer";
import StudioLayer from "./components/studio/StudioLayer";
import StageBand from "./components/studio/StageBand";
import PickMode from "./components/studio/PickMode";

/**
 * ============================================================================
 *  THE HOMEPAGE — a cinematic portfolio that still sells
 * ============================================================================
 *  Order of business:
 *
 *    hero (film only) → intro → approach → statement → templates → archive →
 *    live projects → capability → about → brief → contact → footer
 *
 *  The templates come first: the pinned sideways shelf is the hook, and it is
 *  what the page leads with once the story has been told. The Archive follows
 *  as the frames themselves — the stills, in slots the owner fills from the
 *  dashboard — and the shipped deployments have their own section after it, so
 *  each of the three never has to share a heading with another. The eight-step brief sits
 *  further down the page and the library also lives on /#/builder, reached from
 *  the brief band and the hero, nav and closing CTAs.
 *
 *  ── THE STUDIO'S SHARE OF THIS FILE ──────────────────────────────────────
 *
 *  Two things here belong to `#/admin → Studio` rather than to this design:
 *
 *    order      the sections render from the studio document's own list, so
 *               the owner can move a band up or down, or switch it off, from
 *               the dashboard. Anything the document does not mention is
 *               appended in the committed order, so a new section can never be
 *               lost by a stale document.
 *
 *    stages     a 3D run from the dashboard renders as a real band of this
 *               page — before or after whichever section the owner anchored it
 *               to — rather than as an embed (see `StageBand`).
 *
 *  Both are additive: with an untouched studio document the page below is
 *  exactly the page this file used to be.
 * ============================================================================
 */
export default function PortfolioApp() {
  const [ready, setReady] = useState(false);
  const reduced = usePrefersReducedMotion();
  const site = useSiteData();
  const studio = site.studio;

  // The visitor's palette and the template they are considering — both shared
  // between the homepage brief, the builder page and the template route.
  const [theme, setTheme] = useTheme();
  const templateId = useSelectedTemplateId();

  const selectTemplate = useCallback(
    (template: SiteTemplate) => {
      setSelectedTemplate(template.id);
      setTheme(template.theme);
      window.setTimeout(() => scrollToId("order"), 140);
    },
    [setTheme],
  );

  // Smooth scrolling (skipped entirely for reduced-motion users — and off when
  // the owner switches it off in the dashboard).
  useEffect(
    () => initSmoothScroll(!reduced && studio.effects.smoothScroll),
    [reduced, studio.effects.smoothScroll],
  );

  // The opening counter can be switched off from the dashboard; without it the
  // page has nothing to wait for, so it is simply ready.
  useEffect(() => {
    if (!studio.effects.preloader) setReady(true);
  }, [studio.effects.preloader]);

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

  /**
   * One node per section id. `sec-…` ids are the studio document's, the ids in
   * `PAGE_SECTIONS`; the elements themselves carry the matching `data-tune`
   * attribute so the Studio tab can reach them.
   */
  const sections: Record<string, ReactNode> = {
    hero: (
      <div data-theme="crimson">
        <Hero ready={ready} />
      </div>
    ),
    intro: <HeroIntro />,
    story: <StorySection />,
    statement: <StatementBand />,
    templates: <HorizontalGallery />,
    archive: <GallerySection />,
    projects: <LiveProjects />,
    capability: <CapabilitySection />,
    about: <AboutSection />,
    themes: (
      <section
        id="themes"
        data-tune="sec-themes"
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
    ),
    order: (
      <OrderSection
        templateId={templateId}
        onSelectTemplate={selectTemplate}
        theme={theme}
        onSelectTheme={setTheme}
      />
    ),
    cta: <FinalCTA />,
  };

  return (
    <LightboxProvider>
      {/* The dashboard's stylesheet, and the picker when the Studio tab is
          inspecting this page in its frame. */}
      <StudioLayer doc={studio} />
      <PickMode />

      {studio.effects.preloader ? <Preloader onDone={() => setReady(true)} /> : null}
      <Atmosphere />
      <ScrollProgress />
      <CustomCursor />
      <Navbar ready={ready} />

      <main>
        {studio.order.map((id) => {
          const node = sections[id];
          if (!node || isSectionHidden(studio, id)) return null;
          const before = stagesIn(studio, id, "before");
          const after = stagesIn(studio, id, "after");
          return (
            <Fragment key={id}>
              {before.map((stage) => (
                <StageBand key={stage.id} stage={stage} />
              ))}
              {node}
              {after.map((stage) => (
                <StageBand key={stage.id} stage={stage} />
              ))}
            </Fragment>
          );
        })}
      </main>

      {isSectionHidden(studio, "footer") ? null : <Footer />}
    </LightboxProvider>
  );
}
