import { useEffect, useMemo } from "react";
import { templates, templateById, type SiteTemplate } from "../../data/templates";
import { getThemeById } from "../../lib/theme";
import { linkTo, navigate } from "../../lib/router";
import { setSelectedTemplate } from "../../lib/builderSelection";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";
import { useTemplatePhotos } from "../../lib/siteData";
import TemplatePreview from "./TemplatePreview";

/**
 * ============================================================================
 *  TEMPLATE PAGE — /#/template/<id>
 * ============================================================================
 *  The full concept, at real size, on its own route.
 *
 *  The gallery's "Preview" used to open a modal showing a scaled-down minia-
 *  ture, which is exactly what a visitor cannot judge a website from. Here the
 *  whole document is rendered at (or near) its true size, with the page's own
 *  typography, photography and section rhythm — you scroll it like a website
 *  because that is what it is. On a narrow screen it keeps a legibility floor
 *  and scrolls sideways, the way a desktop preview should.
 *
 *  Around the frame: what is included, the palette, the price and the two ways
 *  to start — so the page never ends in empty space.
 * ============================================================================
 */
export default function TemplatePage({ id }: { id: string }) {
  const template = useMemo(() => templateById(id), [id]);
  const siblings = useMemo(
    () => (template ? templates.filter((t) => t.id !== template.id) : []),
    [template],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    if (!template) return;
    const previous = document.title;
    document.title = `${template.name} — ${template.category} template`;
    return () => {
      document.title = previous;
    };
  }, [template]);

  if (!template) {
    return (
      <div className="shell flex min-h-[70svh] flex-col items-start justify-center gap-6 py-24">
        <p className="eyebrow">Not found</p>
        <h1 className="display text-4xl text-bone sm:text-5xl">That concept does not exist</h1>
        <p className="max-w-[52ch] font-body text-base leading-relaxed text-bone-muted">
          The link may be out of date. The whole library is one click away.
        </p>
        <a href={linkTo("/builder")} className="btn border-blood-600/70 bg-blood-600/15 px-7 py-4">
          See all concepts <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  return <TemplateLayout template={template} siblings={siblings} />;
}

function TemplateLayout({
  template,
  siblings,
}: {
  template: SiteTemplate;
  siblings: SiteTemplate[];
}) {
  const photos = useTemplatePhotos(template.id);
  const theme = getThemeById(template.theme);
  const index = templates.findIndex((t) => t.id === template.id);
  const next = templates[(index + 1) % templates.length];
  const sameBusiness = siblings.filter((t) => t.business === template.business).slice(0, 3);

  const use = () => {
    setSelectedTemplate(template.id);
    navigate("/builder");
  };

  return (
    <div className="min-h-[100svh] bg-ink-950">
      <header className="sticky top-0 z-50 border-b border-bone/10 bg-ink-950/90 backdrop-blur-md">
        <div className="shell flex min-h-[72px] flex-wrap items-center justify-between gap-4 py-3">
          <a
            href={linkTo("/builder")}
            className="group flex items-center gap-3 font-body text-[11px] uppercase tracking-wide2 text-bone-dim transition-colors hover:text-bone"
          >
            <span aria-hidden="true">←</span> All themes
          </a>

          <div className="flex min-w-0 flex-1 items-baseline gap-3 sm:justify-center">
            <span className="display truncate text-lg text-bone">{template.name}</span>
            <span className="hidden font-body text-[10px] uppercase tracking-cinematic text-bone-dim sm:inline">
              {template.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={use}
              className="border border-blood-600/70 bg-blood-600/15 px-4 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-400 hover:bg-blood-600/25"
            >
              Use this template
            </button>
          </div>
        </div>
      </header>

      <main className="pb-24">
        {/* The frame — the real page, scrollable at its own size. */}
        <div className="border-b border-bone/10 bg-ink-900/40">
          <div
            role="region"
            aria-label={`${template.name} — live page preview`}
            tabIndex={0}
            className="overflow-x-auto overscroll-x-contain"
            style={{ scrollbarWidth: "thin" }}
          >
            <TemplatePreview template={template} variant="page" photos={photos} />
          </div>
        </div>

        <section className="shell grid gap-12 pt-16 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">The concept</p>
            <h1 className="display mt-5 text-[11vw] leading-[0.94] text-bone sm:text-5xl">
              {template.name}
            </h1>
            <p className="mt-6 max-w-[60ch] font-body text-base leading-relaxed text-bone-muted">
              {template.blurb}
            </p>
            <p className="mt-4 max-w-[60ch] font-body text-sm leading-relaxed text-bone-dim">
              Everything above is the concept itself — its own type, layout and photography, not a
              generic placeholder. On the real build this becomes a responsive site with your
              content, your prices, your photographs and your contact details, and every picture in
              it can be swapped from the dashboard without touching code.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-bone/10 pt-8 sm:grid-cols-3">
              <div>
                <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  Business
                </dt>
                <dd className="mt-2 font-body text-sm text-bone">{template.business}</dd>
              </div>
              <div>
                <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  Palette
                </dt>
                <dd className="mt-2 flex items-center gap-2 font-body text-sm text-bone">
                  <span className="flex overflow-hidden rounded-sm border border-bone/15">
                    {theme.swatch.map((colour) => (
                      <span key={colour} className="block h-3.5 w-3.5" style={{ background: colour }} />
                    ))}
                  </span>
                  {theme.name}
                </dd>
              </div>
              <div>
                <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  Starting at
                </dt>
                <dd className="mt-2 font-body text-sm text-bone">{template.startingAt}</dd>
              </div>
            </dl>
          </div>

          <aside className="lg:col-span-5">
            <div className="border border-bone/10 bg-ink-900 p-7">
              <p className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
                Included in this build
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {template.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 font-body text-sm text-bone-muted">
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-blood-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 border-t border-bone/10 pt-7">
                <button type="button" onClick={use} className="btn w-full justify-center px-6 py-4">
                  Build mine like this <span aria-hidden="true">→</span>
                </button>
                <a
                  href={buildWhatsAppUrl(introMessage(template.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 border border-bone/20 px-6 py-3.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-blood-500/70 hover:text-bone"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
                  Ask about this one
                </a>
              </div>
            </div>
          </aside>
        </section>

        {/* Never leave the visitor at a dead end. */}
        <section className="shell pt-20" aria-label="More concepts">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-bone/10 pt-8">
            <div>
              <p className="eyebrow">Keep looking</p>
              <h2 className="display mt-3 text-3xl text-bone sm:text-4xl">
                {sameBusiness.length ? `More for ${template.business.toLowerCase()}` : "Other concepts"}
              </h2>
            </div>
            <a
              href={linkTo("/builder")}
              className="font-body text-[11px] uppercase tracking-wide2 text-bone-muted underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
            >
              All {templates.length} concepts
            </a>
          </div>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(sameBusiness.length ? sameBusiness : siblings.slice(0, 3)).map((item) => (
              <li key={item.id}>
                <a
                  href={linkTo(`/template/${item.id}`)}
                  className="group block border border-bone/10 bg-ink-900 transition-colors duration-500 hover:border-blood-500/50"
                >
                  <div data-theme={item.theme} className="overflow-hidden">
                    <TemplatePreview template={item} variant="card" />
                  </div>
                  <div className="flex items-baseline justify-between gap-3 px-5 py-4">
                    <span className="display text-lg text-bone">{item.name}</span>
                    <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      {item.category}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-bone/10 pt-8">
            <a
              href={linkTo(`/template/${next.id}`)}
              className="font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:text-bone"
            >
              Next concept: <span className="text-bone">{next.name}</span> →
            </a>
            <a
              href={linkTo("/builder")}
              className="btn border-bone/20 px-6 py-3.5 text-[11px]"
            >
              Choose a starting point
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
