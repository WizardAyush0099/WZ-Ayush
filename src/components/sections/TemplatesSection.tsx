import { useEffect, useRef, useState } from "react";
import { templates, templatesSection, type SiteTemplate } from "../../data/templates";
import { getThemeById, THEMES, type ThemeId } from "../../lib/theme";
import { linkTo } from "../../lib/router";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";
import { RevealText } from "../common/Reveal";
import TemplatePreview from "../templates/TemplatePreview";

type Props = {
  /** Template the visitor has picked, or null before any choice. */
  activeTemplateId: string | null;
  onSelectTemplate: (template: SiteTemplate) => void;
  /** Palette currently applied to the whole site. */
  theme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
};

/**
 * ============================================================================
 *  TEMPLATES — the dedicated block where visitors pick a starting point
 * ============================================================================
 *  The whole library lives here on the homepage (the same twenty concepts the
 *  builder lists), because "what could my site look like?" is the question the
 *  work above has already earned. Choosing one repaints the entire site in that
 *  template's palette and carries the choice down into the brief, so the
 *  decision is made by looking rather than by reading.
 *
 *  Each card renders a real miniature of that design. Twenty of those at once
 *  is a lot of DOM, so previews mount only as they approach the viewport and
 *  the rest hold a shimmering placeholder — the section stays a scroll away
 *  from costing anything.
 * ============================================================================
 */
export default function TemplatesSection({
  activeTemplateId,
  onSelectTemplate,
  theme,
  onSelectTheme,
}: Props) {
  return (
    <section
      id="templates"
      className="relative z-10 border-y border-bone/10 bg-ink-900 py-20 md:py-28"
      aria-labelledby="templates-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">{templatesSection.eyebrow}</span>
          <h2
            id="templates-title"
            className="display text-[12vw] leading-[0.92] sm:text-5xl lg:text-6xl"
          >
            {templatesSection.title}
          </h2>
          <p className="max-w-[58ch] font-body text-base leading-relaxed text-bone-muted">
            {templatesSection.lede}
          </p>
        </RevealText>

        {/* Palette picker — a real block, not a stray button in the nav. */}
        <div className="mt-10 border border-bone/10 bg-ink-950/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
              Palette
            </span>
            <span className="font-body text-xs text-bone-muted">{templatesSection.note}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {THEMES.map((option) => {
              const active = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectTheme(option.id)}
                  aria-pressed={active}
                  title={option.blurb}
                  className={`group flex items-center gap-3 border px-3 py-2 transition-colors duration-300 ease-silk ${
                    active
                      ? "border-blood-500/70 bg-blood-950/40"
                      : "border-bone/15 hover:border-bone/35"
                  }`}
                >
                  <span className="flex overflow-hidden rounded-sm border border-bone/15">
                    {option.swatch.map((colour) => (
                      <span key={colour} className="block h-4 w-4" style={{ background: colour }} />
                    ))}
                  </span>
                  <span
                    className={`font-body text-[11px] uppercase tracking-wide2 ${
                      active ? "text-bone" : "text-bone-muted group-hover:text-bone"
                    }`}
                  >
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The library */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const active = template.id === activeTemplateId;
            const palette = getThemeById(template.theme);
            return (
              <article
                key={template.id}
                className={`group relative flex flex-col border transition-colors duration-500 ease-silk ${
                  active
                    ? "border-blood-500/70 bg-ink-950"
                    : "border-bone/10 bg-ink-950/60 hover:border-bone/30"
                }`}
              >
                {/* Each preview renders in its OWN palette. */}
                <div data-theme={template.theme} className="relative overflow-hidden">
                  <LazyPreview template={template} />
                  {active ? (
                    <span className="absolute right-3 top-3 z-10 border border-blood-500/70 bg-ink-950/85 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-blood-300">
                      Selected
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
                      {template.category}
                    </span>
                    <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      from {template.startingAt}
                    </span>
                  </div>

                  <h3 className="display text-2xl leading-tight text-bone">{template.name}</h3>
                  <p className="font-body text-sm leading-relaxed text-bone-muted">{template.blurb}</p>

                  <ul className="flex flex-wrap gap-2 pt-1">
                    {template.features.map((feature) => (
                      <li
                        key={feature}
                        className="border border-bone/10 px-2.5 py-1 font-body text-[9px] uppercase tracking-wide2 text-bone-dim"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => onSelectTemplate(template)}
                    aria-pressed={active}
                    className={`mt-auto border px-4 py-3 font-body text-[10px] uppercase tracking-wide2 transition-colors duration-300 ${
                      active
                        ? "border-blood-500/70 bg-blood-950/40 text-bone"
                        : "border-bone/20 text-bone-muted hover:border-blood-500/60 hover:text-bone"
                    }`}
                  >
                    {active ? "Chosen — continue below" : "Choose this template"}
                  </button>
                  <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                    Palette · {palette.name}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Two ways forward: pick here and send the brief below, or take the
            full guided flow. */}
        <div className="mt-12 flex flex-col gap-5 border-t border-bone/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[52ch] font-body text-sm leading-relaxed text-bone-muted">
            Not sure which one fits? The guided version walks through it in eight short steps and
            sends the finished brief straight to WhatsApp.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={linkTo("/builder")}
              data-cursor="hover"
              className="btn border-blood-600/70 bg-blood-600/15 px-6 py-3.5 text-[11px] sm:px-8 sm:py-4 sm:text-[12px]"
            >
              Open the full builder
              <span aria-hidden="true">→</span>
            </a>
            <a
              href={buildWhatsAppUrl(introMessage())}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="hover"
              className="inline-flex items-center gap-3 border border-bone/20 px-6 py-3.5 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-500 ease-silk hover:border-blood-500/60 hover:text-bone sm:px-7 sm:py-4 sm:text-[12px]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
              Talk on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lazy miniature                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Mounts the real preview only once the card is within a screen or so of the
 * viewport. Twenty full miniatures is thousands of nodes; this keeps the
 * section cheap until it is actually looked at.
 */
function LazyPreview({ template }: { template: SiteTemplate }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || shown) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div ref={hostRef} className="relative">
      {shown ? (
        // On phones the thumbnail is cropped to the top of the design: twenty
        // full-height cards is a very long scroll on a small screen, and the
        // header + hero is the slice that actually identifies a layout.
        <div className="max-h-[46vh] overflow-hidden sm:max-h-none">
          <TemplatePreview template={template} />
        </div>
      ) : (
        // Matches the mounted preview's height at every breakpoint — the
        // card's own ratio (1100 × 1560) above `sm`, the crop below it — so
        // the grid never shifts when a preview swaps in.
        <div
          className="h-[46vh] w-full animate-shimmer bg-bone/5 sm:h-auto sm:aspect-[1100/1560]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
