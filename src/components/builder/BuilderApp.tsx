import { useCallback, useEffect, useState } from "react";
import { builder, contact, meta } from "../../data/content";
import {
  templates,
  templatesSection,
  type SiteTemplate,
} from "../../data/templates";
import { getThemeById, THEMES, useTheme, type ThemeId } from "../../lib/theme";
import { linkTo } from "../../lib/router";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";
import Footer from "../sections/Footer";
import ThemeToggle from "../theme/ThemeToggle";
import TemplatePreview from "../templates/TemplatePreview";
import OrderForm from "./OrderForm";

/**
 * ============================================================================
 *  BUILDER — /#/builder
 * ============================================================================
 *  The whole "commission a website" experience, deliberately on its own route
 *  so the homepage stays a cinematic portfolio rather than a sales funnel.
 *
 *  The core interaction: choosing a template repaints this page in that
 *  template's palette *in place*. Nothing navigates, nothing reloads — the
 *  visitor judges a palette by looking at it, which is the only honest way to
 *  choose one.
 * ============================================================================
 */
export default function BuilderApp() {
  const [theme, setTheme] = useTheme();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [preview, setPreview] = useState<SiteTemplate | null>(null);

  // Make sure we land at the top when the route opens.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const previous = document.title;
    document.title = "Build My Website — Ayush";
    return () => {
      document.title = previous;
    };
  }, []);

  const selectTemplate = useCallback(
    (template: SiteTemplate) => {
      setTemplateId(template.id);
      setTheme(template.theme);
    },
    [setTheme],
  );

  const chooseTheme = useCallback((next: ThemeId) => setTheme(next), [setTheme]);

  const active = templateId ? templates.find((t) => t.id === templateId) ?? null : null;
  const activeTheme = getThemeById(theme);

  return (
    <div className="min-h-[100svh] bg-ink-950">
      {/* Compact header — this page has one job, so navigation stays minimal. */}
      <header className="sticky top-0 z-40 border-b border-bone/10 bg-ink-950/85 backdrop-blur-md">
        <div className="shell flex h-[72px] items-center justify-between gap-4">
          <a
            href={linkTo("/")}
            className="group flex items-baseline gap-2"
            aria-label={`${meta.studio} — back to the site`}
          >
            <span className="font-body text-[11px] uppercase tracking-wide2 text-bone-dim transition-colors group-hover:text-bone">
              ←
            </span>
            <span className="display text-lg tracking-[0.28em] text-bone transition-colors group-hover:text-blood-400">
              {meta.studio}
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden font-body text-[10px] uppercase tracking-cinematic text-bone-dim sm:inline">
              Palette · {activeTheme.name}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        {/* Intro */}
        <section className="shell pt-16 pb-10 md:pt-24">
          <p className="eyebrow">{builder.eyebrow}</p>
          <h1 className="display mt-5 max-w-[18ch] text-[13vw] leading-[0.9] text-bone sm:text-6xl lg:text-7xl">
            {builder.title}
          </h1>
          <p className="mt-6 max-w-[62ch] font-body text-base leading-relaxed text-bone-muted">
            {builder.lede}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={buildWhatsAppUrl(introMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-bone/20 px-6 py-3.5 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500/80"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
              Talk on WhatsApp
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="font-body text-[11px] uppercase tracking-wide2 text-bone-muted underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
            >
              {contact.email}
            </a>
          </div>
        </section>

        {/* Template gallery + palette */}
        <section
          id="templates"
          className="border-y border-bone/10 bg-ink-900 py-16 md:py-20"
          aria-labelledby="templates-title"
        >
          <div className="shell">
            <div className="flex flex-col gap-5">
              <p className="eyebrow">{templatesSection.eyebrow}</p>
              <h2
                id="templates-title"
                className="display text-[11vw] leading-[0.92] text-bone sm:text-5xl"
              >
                {templatesSection.title}
              </h2>
              <p className="max-w-[64ch] font-body text-base leading-relaxed text-bone-muted">
                {templatesSection.lede}
              </p>
            </div>

            {/* Standing palette picker — the same control the theme step uses. */}
            <div className="mt-9 flex flex-wrap items-center gap-3 border border-bone/10 bg-ink-950/60 p-4 sm:p-5">
              <span className="font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
                Palette
              </span>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((option) => {
                  const on = option.id === theme;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => chooseTheme(option.id)}
                      aria-pressed={on}
                      title={option.blurb}
                      className={`flex items-center gap-2 border px-2.5 py-2 transition-colors duration-300 ${
                        on ? "border-blood-500/70 bg-blood-950/40" : "border-bone/15 hover:border-bone/35"
                      }`}
                    >
                      <span className="flex overflow-hidden rounded-sm border border-bone/15">
                        {option.swatch.map((colour) => (
                          <span key={colour} className="block h-3.5 w-3.5" style={{ background: colour }} />
                        ))}
                      </span>
                      <span
                        className={`font-body text-[10px] uppercase tracking-wide2 ${
                          on ? "text-bone" : "text-bone-muted"
                        }`}
                      >
                        {option.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="w-full font-body text-[11px] text-bone-dim sm:ml-auto sm:w-auto">
                {templatesSection.note}
              </span>
            </div>

            {/* Cards */}
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => {
                const on = template.id === templateId;
                return (
                  <article
                    key={template.id}
                    className={`group relative flex flex-col border transition-colors duration-500 ease-silk ${
                      on ? "border-blood-500/70 bg-ink-950" : "border-bone/10 bg-ink-950/60 hover:border-bone/30"
                    }`}
                  >
                    {/* Each preview renders in its OWN palette. */}
                    <div data-theme={template.theme} className="relative overflow-hidden">
                      <TemplatePreview template={template} />
                      {on ? (
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

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => selectTemplate(template)}
                          aria-pressed={on}
                          className={`border px-4 py-2.5 font-body text-[10px] uppercase tracking-wide2 transition-colors duration-300 ${
                            on
                              ? "border-blood-500/70 bg-blood-950/40 text-bone"
                              : "border-bone/20 text-bone-muted hover:border-blood-500/60 hover:text-bone"
                          }`}
                        >
                          {on ? "Chosen" : "Use this template"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreview(template)}
                          className="border border-bone/15 px-4 py-2.5 font-body text-[10px] uppercase tracking-wide2 text-bone-dim transition-colors duration-300 hover:border-bone/35 hover:text-bone"
                        >
                          Preview
                        </button>
                      </div>
                      <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        Palette · {getThemeById(template.theme).name}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* The brief */}
        <section id="brief" className="shell py-16 md:py-24" aria-labelledby="brief-title">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">The brief</p>
              <h2
                id="brief-title"
                className="display mt-5 text-[11vw] leading-[0.92] text-bone sm:text-5xl"
              >
                Tell Me What You Want
              </h2>
              <p className="mt-6 max-w-[46ch] font-body text-base leading-relaxed text-bone-muted">
                Eight short steps. The more specific you are — especially about what you
                <em className="not-italic text-bone"> don't </em>
                want — the closer the first draft lands.
              </p>

              <dl className="mt-9 flex flex-col gap-4 border-t border-bone/10 pt-7">
                {active ? (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      Template
                    </dt>
                    <dd className="font-body text-sm text-bone">{active.name}</dd>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                    Palette
                  </dt>
                  <dd className="font-body text-sm text-bone">{activeTheme.name}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                    Reply time
                  </dt>
                  <dd className="font-body text-sm text-bone">Within one working day</dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={buildWhatsAppUrl(introMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 border border-bone/20 px-5 py-3.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-500 ease-silk hover:border-blood-500/70 hover:text-bone"
                >
                  Prefer to chat? WhatsApp
                </a>
              </div>
            </div>

            <div className="lg:col-span-8">
              <OrderForm
                templateId={templateId}
                onSelectTemplate={selectTemplate}
                theme={theme}
                onSelectTheme={chooseTheme}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Full-size template preview */}
      {preview ? (
        <TemplatePreviewModal template={preview} onClose={() => setPreview(null)} onUse={() => {
          selectTemplate(preview);
          setPreview(null);
        }} />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Preview modal                                                             */
/* -------------------------------------------------------------------------- */

function TemplatePreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: SiteTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${template.name} — full preview`}
      className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-ink-950/95 p-4 backdrop-blur-md sm:p-8"
    >
      <div className="w-full max-w-4xl border border-bone/15 bg-ink-950">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-bone/10 px-5 py-4">
          <div>
            <p className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
              {template.category}
            </p>
            <h2 className="display mt-1 text-2xl text-bone">{template.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onUse}
              className="border border-blood-500/70 bg-blood-950/40 px-4 py-2.5 font-body text-[10px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-400"
            >
              Use this template
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex h-10 w-10 items-center justify-center border border-bone/20 text-bone transition-colors hover:border-blood-500/70"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {/* The preview inherits the template's palette, not the page's. */}
          <div data-theme={template.theme} className="border border-bone/10">
            <TemplatePreview template={template} variant="full" />
          </div>
          <p className="mt-4 font-body text-xs text-bone-dim">
            This is a live miniature of the layout — the real build is responsive, animated and
            filled with your content.
          </p>
        </div>
      </div>
    </div>
  );
}
