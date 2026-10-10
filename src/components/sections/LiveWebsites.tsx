import { liveWebsitesSection } from "../../data/content";
import { useSiteData } from "../../lib/siteData";
import { RevealText } from "../common/Reveal";

/**
 * "Live on the web" — the deployments that actually exist.
 *
 * Only projects with a URL appear, and each one opens the real site in a new
 * tab. Nothing here is a placeholder: if a project has no verified URL it
 * simply does not show up, rather than linking somewhere that 404s.
 */
export default function LiveWebsites() {
  const site = useSiteData();
  const live = site.projects.filter((p) => p.href && p.showInLiveStrip);

  if (!live.length) return null;

  return (
    <section
      id="websites"
      className="relative z-10 border-y border-bone/10 bg-ink-900 py-20 md:py-28"
      aria-labelledby="websites-title"
    >
      <div className="shell">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">{liveWebsitesSection.eyebrow}</span>
          <h2
            id="websites-title"
            className="display text-[12vw] leading-[0.9] sm:text-5xl lg:text-6xl"
          >
            {liveWebsitesSection.title}
          </h2>
          <p className="max-w-[54ch] font-body text-base leading-relaxed text-bone-muted">
            {liveWebsitesSection.lede}
          </p>
        </RevealText>

        <ul className="mt-14 grid gap-8 md:grid-cols-2">
          {live.map((project) => (
            <li key={project.id} className="group">
              <article className="flex h-full flex-col border border-bone/10 bg-ink-950/60 transition-colors duration-500 ease-silk hover:border-bone/30">
                {/* Browser frame */}
                <div className="border-b border-bone/10 bg-ink-900/80 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-bone/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-bone/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-bone/20" />
                    <span className="mx-auto flex max-w-[80%] items-center gap-2 truncate rounded-sm bg-bone/5 px-3 py-[3px] font-body text-[10px] text-bone-dim">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                      />
                      {hostOf(project.href ?? "")}
                    </span>
                  </div>
                </div>

                <div className="relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={`${project.title} — ${project.category}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-[1.04]"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
                      {project.category}
                    </span>
                    {project.live ? (
                      <span className="flex items-center gap-2 border border-emerald-400/40 px-2.5 py-1 font-body text-[9px] uppercase tracking-wide2 text-emerald-200/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                        Live
                      </span>
                    ) : null}
                  </div>

                  <h3 className="display text-2xl leading-tight text-bone">{project.title}</h3>
                  {project.parent ? (
                    <p className="font-body text-[11px] uppercase tracking-wide2 text-bone-dim">
                      Part of {project.parent}
                    </p>
                  ) : null}
                  <p className="max-w-[46ch] font-body text-sm leading-relaxed text-bone-muted">
                    {project.description}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="hover"
                      className="group/btn inline-flex items-center gap-3 border border-blood-600/70 bg-blood-600/10 px-5 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500 hover:bg-blood-600/20"
                    >
                      Open live site
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-500 ease-silk group-hover/btn:translate-x-1"
                      >
                        ↗
                      </span>
                    </a>
                    {project.stack.slice(0, 3).map((chip) => (
                      <span
                        key={chip}
                        className="border border-bone/10 px-2.5 py-1 font-body text-[9px] uppercase tracking-wide2 text-bone-dim"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** `https://study-hub-kappa.vercel.app/x` → `study-hub-kappa.vercel.app` */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
