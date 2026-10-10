import { contact, hero as heroContent } from "../../data/content";
import { linkTo } from "../../lib/router";
import { scrollToId } from "../../lib/scroll";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";
import { RevealText } from "../common/Reveal";

/**
 * ============================================================================
 *  INTRO — everything the hero has to say, below the film
 * ============================================================================
 *  This is the hero's copy, deliberately not on top of the hero. The film
 *  above plays completely clean, and the moment it is over this section
 *  scrolls in with the wordmark, the headline, the calls to action and the
 *  direct contact details — in normal document flow, so it is measured,
 *  readable, selectable and never covering a frame.
 *
 *  It is also the document's `<h1>`: the reel itself is `aria-label`led as a
 *  film, so assistive technology (and search engines) get the pitch here.
 * ============================================================================
 */
export default function HeroIntro() {
  return (
    <section
      id="intro"
      className="relative z-10 bg-ink-950 pb-20 pt-14 md:pb-28 md:pt-24"
      aria-labelledby="intro-title"
    >
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          {/* Brand + headline */}
          <div className="lg:col-span-7">
            <RevealText stagger className="flex flex-col gap-5">
              <p className="inline-flex w-fit items-center gap-3 border border-bone/10 bg-ink-900/60 px-4 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blood-500" />
                </span>
                Available for work
              </p>

              <span className="eyebrow">{heroContent.traits}</span>

              <span
                aria-hidden="true"
                className="display text-hollow block text-[20vw] leading-[0.85] sm:text-[6.5rem] lg:text-[7.5rem]"
              >
                {heroContent.title}
              </span>

              <h1
                id="intro-title"
                className="display text-[9vw] leading-[1.02] text-bone sm:text-[2.5rem] lg:text-[3.1rem]"
              >
                {heroContent.tagline}
              </h1>
            </RevealText>
          </div>

          {/* Pitch + actions */}
          <div className="lg:col-span-5 lg:pb-2">
            <RevealText stagger className="flex flex-col gap-7">
              <p className="max-w-[48ch] font-body text-[15px] leading-relaxed text-bone-muted sm:text-base">
                {heroContent.lede}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={linkTo("/builder")}
                  data-cursor="hover"
                  className="btn border-blood-600/70 bg-blood-600/15 px-6 py-4 text-[11px] sm:text-[12px]"
                >
                  {heroContent.primaryCta}
                  <span aria-hidden="true">→</span>
                </a>
                <button
                  type="button"
                  onClick={() => scrollToId("work")}
                  data-cursor="hover"
                  className="group inline-flex items-center gap-2 border border-bone/20 px-6 py-4 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-500 ease-silk hover:border-bone/40 hover:text-bone sm:text-[12px]"
                >
                  {heroContent.secondaryCta}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-bone/10 pt-6">
                <a
                  href={buildWhatsAppUrl(introMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="hover"
                  className="group flex items-center gap-2 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
                  WhatsApp {contact.whatsappDisplay}
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  data-cursor="hover"
                  className="group flex items-center gap-2 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone"
                >
                  <span aria-hidden="true">✉</span>
                  {contact.email}
                </a>
              </div>
            </RevealText>
          </div>
        </div>
      </div>
    </section>
  );
}
