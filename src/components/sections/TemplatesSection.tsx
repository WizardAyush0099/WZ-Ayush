import { templates, templatesSection, type SiteTemplate } from "../../data/content";
import { THEMES, getThemeById, type ThemeId } from "../../lib/theme";
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
 *  Deliberately NOT a floating control in the header. Choosing a template
 *  repaints the entire site in that template's palette, so the decision is
 *  made by looking rather than by reading.
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
      className="relative z-10 bg-ink-900 py-24 md:py-32"
      aria-labelledby="templates-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">{templatesSection.eyebrow}</span>
          <h2
            id="templates-title"
            className="display text-[11vw] leading-[0.9] sm:text-5xl lg:text-6xl"
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

        {/* Template grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const active = template.id === activeTemplateId;
            const palette = getThemeById(template.theme);
            return (
              <article
                key={template.id}
                className={`group relative flex flex-col border text-left transition-colors duration-500 ease-silk ${
                  active
                    ? "border-blood-500/70 bg-ink-950"
                    : "border-bone/10 bg-ink-950/60 hover:border-bone/30"
                }`}
              >
                {/* Each preview renders in its OWN palette. */}
                <div data-theme={template.theme} className="relative overflow-hidden">
                  <TemplatePreview kind={template.kind} name={template.name} domain={template.domain} />
                  {active ? (
                    <span className="absolute right-3 top-3 z-10 border border-blood-500/70 bg-ink-950/85 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-blood-300">
                      Selected
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
                      {template.category}
                    </span>
                    <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      from {template.startingAt}
                    </span>
                  </div>

                  <h3 className="display text-2xl leading-tight text-bone">{template.name}</h3>
                  <p className="font-body text-sm leading-relaxed text-bone-muted">{template.blurb}</p>

                  <ul className="mt-auto flex flex-wrap gap-2 pt-2">
                    {template.features.map((feature) => (
                      <li
                        key={feature}
                        className="border border-bone/10 px-2.5 py-1 font-body text-[9px] uppercase tracking-wide2 text-bone-dim"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <span className="mt-1 flex items-center gap-2 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors duration-300 group-hover:text-blood-300">
                    {active ? "Chosen — continue below" : "Choose this template"}
                    <span aria-hidden="true" className="transition-transform duration-500 ease-silk group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                  <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                    Palette · {palette.name}
                  </span>
                </div>

                {/* Single accessible click target covering the whole card. */}
                <button
                  type="button"
                  onClick={() => onSelectTemplate(template)}
                  aria-pressed={active}
                  aria-label={`Choose the ${template.name} template — ${template.category}, from ${template.startingAt}`}
                  className="absolute inset-0 z-20"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
