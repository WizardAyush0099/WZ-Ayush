import { useMemo, useRef } from "react";
import { liveProjectsSection } from "../../data/content";
import { useImageSlots, useSiteData } from "../../lib/siteData";
import { useSpotlight } from "../../lib/hooks";
import { RevealText } from "../common/Reveal";
import SlotMedia from "../media/SlotMedia";
import SplitReveal from "../fx/SplitReveal";
import Magnetic from "../fx/Magnetic";
import TiltCard from "../fx/TiltCard";

/**
 * ============================================================================
 *  LIVE PROJECTS — the deployments, in their own section
 * ============================================================================
 *  These cards used to sit on top of The Archive. They have moved out on their
 *  own: the Archive now belongs to the frames (the sequence and the stills),
 *  and the shipped work reads better as the section it is rather than as a
 *  header block above somebody else's content.
 *
 *  Only projects with a URL appear — a card here is a promise that something
 *  opens. Study Hub, Guitar Theory Lab and FitLife Blueprint all qualify, and
 *  Study Hub's card carries its sibling pages as quick links, so the E-books
 *  Store stays reachable without a fourth card saying the same thing.
 *
 *  The preview picture on each card can come from the section-wise image
 *  manager instead of the project record: slot 01 of the "Featured work"
 *  section styles the first card, slot 02 the second, and so on. A card whose
 *  slot is switched off keeps the image set in the Projects tab.
 *
 *  A card is also the most interactive thing on the page: it leans back in 3D
 *  under the pointer with a specular light riding across it (`TiltCard`), the
 *  spotlight follows the pointer across it (`useSpotlight`), a chromatic sweep
 *  crosses its frame on hover, and the button that opens the live site leans
 *  towards the cursor. All four are decoration and all four are skipped on
 *  touch and under reduced motion.
 * ============================================================================
 */
export default function LiveProjects() {
  const site = useSiteData();
  const slots = useImageSlots("projects");
  const sectionRef = useRef<HTMLElement>(null);
  const projects = useMemo(
    () => site.projects.filter((p) => p.href && p.showInArchive),
    [site.projects],
  );

  /** The pointer's light, written on whichever card is under it. */
  useSpotlight(sectionRef);

  if (!projects.length) return null;

  return (
    <section
      ref={sectionRef}
      id="projects"
      data-tune="sec-projects"
      className="relative z-10 border-y border-bone/10 bg-ink-900 py-20 md:py-28"
      aria-labelledby="projects-title"
    >
      <div className="shell">
        <div data-tune="item-projects-head">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">{liveProjectsSection.eyebrow}</span>
          <SplitReveal
            as="h2"
            id="projects-title"
            text={liveProjectsSection.title}
            type="words"
            className="display text-[12vw] leading-[0.9] sm:text-5xl lg:text-6xl"
          />
          <p className="max-w-[54ch] font-body text-base leading-relaxed text-bone-muted">
            {liveProjectsSection.lede}
          </p>
        </RevealText>
        </div>

        <div className="mt-14 flex flex-wrap items-baseline justify-between gap-3 border-t border-bone/10 pt-6">
          <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
            {liveProjectsSection.projectsLabel} · {String(projects.length).padStart(2, "0")}
          </span>
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            {liveProjectsSection.note}
          </span>
        </div>

        <ul data-tune="item-projects-grid" className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const slot = slots.find((entry) => entry.index === index + 1);
            return (
            <li key={project.id} className="group">
              <TiltCard
                as="article"
                data-spotlight
                depth={0}
                className="spotlight halo group/card flex h-full flex-col border border-bone/10 bg-ink-950/60 transition-colors duration-500 ease-silk hover:border-bone/30"
              >
                {/* The light that circles the frame on hover. */}
                <span className="halo-rim" aria-hidden="true" />

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

                <div className="sheen relative overflow-hidden">
                  {slot ? (
                    <SlotMedia
                      slot={slot}
                      aspect="aspect-[16/10]"
                      className="w-full"
                      mediaClassName="transition-transform duration-[1200ms] ease-silk group-hover:scale-[1.04]"
                    />
                  ) : (
                    <img
                      src={project.image}
                      alt={`${project.title} — ${project.category}`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-[1.04]"
                    />
                  )}
                  {project.live ? (
                    <span className="absolute right-3 top-3 flex items-center gap-2 border border-emerald-400/40 bg-ink-950/80 px-2.5 py-1 font-body text-[9px] uppercase tracking-wide2 text-emerald-200/90 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      Live
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
                    {project.category}
                  </span>
                  <h3 className="display text-2xl leading-tight text-bone">{project.title}</h3>
                  {project.parent ? (
                    <p className="font-body text-[11px] uppercase tracking-wide2 text-bone-dim">
                      Part of {project.parent}
                    </p>
                  ) : null}
                  <p className="font-body text-sm leading-relaxed text-bone-muted">
                    {project.description}
                  </p>

                  <div className="mt-auto flex flex-col gap-3 pt-3">
                    <Magnetic strength={0.14} className="w-full">
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="hover"
                        className="group/btn inline-flex w-full items-center justify-between gap-3 border border-blood-600/70 bg-blood-600/10 px-5 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500 hover:bg-blood-600/20"
                      >
                        {liveProjectsSection.visitLabel}
                        <span
                          aria-hidden="true"
                          className="transition-transform duration-500 ease-silk group-hover/btn:translate-x-1"
                        >
                          ↗
                        </span>
                      </a>
                    </Magnetic>

                    {/* The project's other pages — options, not extra cards. */}
                    {project.pages?.length ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-full font-body text-[9px] uppercase tracking-wide2 text-bone-dim sm:w-auto">
                          Also live
                        </span>
                        {project.pages.map((page) => (
                          <a
                            key={page.href}
                            href={page.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-cursor="hover"
                            className="border border-bone/10 px-2.5 py-1.5 font-body text-[9px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:border-bone/35 hover:text-bone"
                          >
                            {page.label} ↗
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </TiltCard>
            </li>
            );
          })}
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
