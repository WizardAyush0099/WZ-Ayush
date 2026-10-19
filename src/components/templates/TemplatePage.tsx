import { useEffect, useMemo } from "react";
import { templates, templateById, type SiteTemplate } from "../../data/templates";
import { getThemeById } from "../../lib/theme";
import { linkTo, navigate } from "../../lib/router";
import { scrollToId } from "../../lib/scroll";
import { setSelectedTemplate } from "../../lib/builderSelection";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";
import LivePreviewFrame from "../media/LivePreviewFrame";

/**
 * ============================================================================
 *  TEMPLATE PAGE — /#/template/<id>
 * ============================================================================
 *  The real template, at full size, on its own route.
 *
 *  Every template is a complete HTML site shipped in `public/templates/`, so
 *  this page hosts it in a full-viewport iframe: the visitor scrolls the
 *  website itself — its own type, photography and section rhythm — not a
 *  miniature of it. The bar above keeps the two ways out (start from this one,
 *  or open the raw page) so the visitor is never trapped in the frame.
 *
 *  Below the frame: what the build includes, the palette, and the rest of the
 *  library — so the route never ends in empty space. No price is shown for a
 *  build; the cost is discussed with the client directly.
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
        <h1 className="display text-4xl text-bone sm:text-5xl">That template does not exist</h1>
        <p className="max-w-[52ch] font-body text-base leading-relaxed text-bone-muted">
          The link may be out of date. The whole library is one click away.
        </p>
        <a href={linkTo("/builder")} className="btn border-blood-600/70 bg-blood-600/15 px-7 py-4">
          See all six templates <span aria-hidden="true">→</span>
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
  const theme = getThemeById(template.theme);
  const index = templates.findIndex((t) => t.id === template.id);
  const next = templates[(index + 1) % templates.length];

  const use = () => {
    setSelectedTemplate(template.id);
    navigate("/builder");
    // Land the visitor on the brief, with this template already chosen.
    window.setTimeout(() => scrollToId("brief"), 320);
  };

  return (
    <div className="min-h-[100svh] bg-ink-950">
      <header className="sticky top-0 z-50 border-b border-bone/10 bg-ink-950/90 backdrop-blur-md">
        <div className="shell flex min-h-[72px] flex-wrap items-center justify-between gap-4 py-3">
          <a
            href={linkTo("/builder")}
            className="group flex items-center gap-3 font-body text-[11px] uppercase tracking-wide2 text-bone-dim transition-colors hover:text-bone"
          >
            <span aria-hidden="true">←</span> All templates
          </a>

          <div className="flex min-w-0 flex-1 items-baseline gap-3 sm:justify-center">
            <span className="display truncate text-lg text-bone">{template.name}</span>
            <span className="hidden font-body text-[10px] uppercase tracking-cinematic text-bone-dim sm:inline">
              {template.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={template.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden border border-bone/20 px-4 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/40 hover:text-bone sm:inline-block"
            >
              Open raw page ↗
            </a>
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

      <main>
        {/* The frame — the real site, scrolled at its own size. */}
        <div className="relative border-b border-bone/10 bg-ink-900/40">
          <iframe
            src={template.href}
            title={`${template.name} — live template preview`}
            loading="eager"
            className="h-[calc(100svh-72px)] min-h-[520px] w-full border-0 bg-white"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-950/70 to-transparent" aria-hidden="true" />
        </div>

        <section className="shell grid gap-12 pt-16 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">The template</p>
            <h1 className="display mt-5 text-[11vw] leading-[0.94] text-bone sm:text-5xl">
              {template.name}
            </h1>
            <p className="mt-6 max-w-[60ch] font-body text-base leading-relaxed text-bone-muted">
              {template.blurb}
            </p>
            <p className="mt-4 max-w-[60ch] font-body text-sm leading-relaxed text-bone-dim">
              What you scrolled above is the template itself — its own type, layout and
              photography, not a placeholder. On the real build it becomes a responsive site with
              your content, your prices, your photographs and your contact details.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-bone/10 pt-8 sm:grid-cols-3">
              <div>
                <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  Trade
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
        <section className="shell pt-20 pb-24" aria-label="More templates">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-bone/10 pt-8">
            <div>
              <p className="eyebrow">Keep looking</p>
              <h2 className="display mt-3 text-3xl text-bone sm:text-4xl">The other five</h2>
            </div>
            <a
              href={linkTo("/builder")}
              className="font-body text-[11px] uppercase tracking-wide2 text-bone-muted underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
            >
              All {templates.length} templates
            </a>
          </div>

          {/*
            The other five, live — the same treatment as the homepage shelf:
            laid out at desktop width and scaled to the card, so the rectangle
            shows the template instead of cropping it. Two up, which leaves each
            frame big enough to actually read.
          */}
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {siblings.map((item) => (
              <li key={item.id}>
                <a
                  href={linkTo(`/template/${item.id}`)}
                  className="group block border border-bone/10 bg-ink-900 transition-colors duration-500 hover:border-blood-500/50"
                >
                  <div className="relative border-b border-bone/10 bg-ink-950">
                    <LivePreviewFrame
                      src={item.href}
                      title={`${item.name} — live template preview`}
                      className="aspect-[16/10] w-full"
                    />
                    <span className="pointer-events-none absolute left-3 top-3 flex gap-1.5" aria-hidden="true">
                      <span className="h-2 w-2 rounded-full bg-bone/20" />
                      <span className="h-2 w-2 rounded-full bg-bone/20" />
                      <span className="h-2 w-2 rounded-full bg-bone/20" />
                    </span>
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink-950/60 font-body text-[11px] uppercase tracking-wide2 text-bone opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      Open template →
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <span className="display block truncate text-lg text-bone">{item.name}</span>
                    <span className="mt-1 block font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
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
              Next template: <span className="text-bone">{next.name}</span> →
            </a>
            <a href={linkTo("/builder")} className="btn border-bone/20 px-6 py-3.5 text-[11px]">
              Choose a starting point
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
