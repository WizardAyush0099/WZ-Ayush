import { useEffect, useState } from "react";
import type { Project } from "../../data/content";
import {
  DEFAULT_SITE_DATA,
  isRemoteSiteDataEnabled,
  publishSiteData,
  replaceProjects,
  useSiteData,
} from "../../lib/siteData";

const fieldClass =
  "w-full border border-bone/15 bg-ink-950 px-3 py-2.5 font-body text-xs text-bone placeholder:text-bone-dim focus:border-blood-500/70 focus:outline-none";
const labelClass = "mb-1.5 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim";

type Status = { ok: boolean; detail: string } | null;

function blank(index: number): Project {
  return {
    id: `project-${Date.now().toString(36)}`,
    index: String(index + 1).padStart(2, "0"),
    title: "New project",
    accent: "",
    category: "",
    description: "",
    image: "",
    highlights: [],
    stack: [],
    href: "",
    live: false,
    showInLiveStrip: false,
  };
}

/**
 * ============================================================================
 *  PROJECTS — the work shown on the homepage
 * ============================================================================
 *  Cards are edited here, saved in this browser, and published to the shared
 *  backend so every visitor sees the same list. A card is only marked "Live"
 *  when it has a URL, because a Live badge on a 404 is worse than no badge.
 * ============================================================================
 */
export default function ProjectsPanel() {
  const site = useSiteData();
  const [draft, setDraft] = useState<Project[]>(site.projects);
  const [openId, setOpenId] = useState<string | null>(site.projects[0]?.id ?? null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(site.projects);
  }, [site.projects]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(site.projects);

  const patch = (id: string, changes: Partial<Project>) =>
    setDraft((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    // Keep the display numbers in step with the order.
    setDraft(next.map((p, i) => ({ ...p, index: String(i + 1).padStart(2, "0") })));
  };

  const save = async (publish: boolean) => {
    setBusy(true);
    setStatus(null);
    replaceProjects(draft);
    if (!publish) {
      setStatus({ ok: true, detail: "Saved in this browser. Publish to reach every visitor." });
      setBusy(false);
      return;
    }
    setStatus(await publishSiteData());
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[70ch] font-body text-xs leading-relaxed text-bone-muted">
          {draft.length} project{draft.length === 1 ? "" : "s"}. Use the four verified URLs already
          filled in — <code className="text-bone">Live</code> badges and the homepage strip follow
          whatever you set here.
          {isRemoteSiteDataEnabled ? "" : " (No shared backend is configured for this build.)"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = [...draft, blank(draft.length)];
              setDraft(next);
              setOpenId(next[next.length - 1].id);
            }}
            className="border border-bone/20 px-4 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/40 hover:text-bone"
          >
            + Add project
          </button>
          <button
            type="button"
            disabled={busy || !dirty}
            onClick={() => void save(false)}
            className="border border-bone/20 px-4 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/40 hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save(true)}
            className="border border-blood-600/70 bg-blood-600/10 px-4 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-500 disabled:opacity-40"
          >
            {busy ? "Publishing…" : "Save & publish"}
          </button>
        </div>
      </div>

      {status ? (
        <p
          className={`border px-4 py-3 font-body text-xs ${
            status.ok
              ? "border-emerald-400/40 bg-emerald-950/20 text-emerald-200/90"
              : "border-blood-600/50 bg-blood-950/40 text-blood-200"
          }`}
        >
          {status.detail}
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {draft.map((project, i) => {
          const open = openId === project.id;
          return (
            <li key={project.id} className="border border-bone/10 bg-ink-900">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : project.id)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <span className="h-12 w-16 shrink-0 overflow-hidden border border-bone/10 bg-ink-950">
                    {project.image ? (
                      <img src={project.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg text-bone">
                      {project.index} · {project.title}
                    </span>
                    <span className="block truncate font-body text-[11px] text-bone-dim">
                      {project.category || "No category"}
                      {project.href ? " · has link" : " · no link"}
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {project.href && project.live ? (
                    <span className="border border-emerald-400/40 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-emerald-200/90">
                      Live
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${project.title} up`}
                    className="border border-bone/15 px-2.5 py-1.5 font-body text-[11px] text-bone-dim transition-colors hover:border-bone/35 hover:text-bone disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === draft.length - 1}
                    aria-label={`Move ${project.title} down`}
                    className="border border-bone/15 px-2.5 py-1.5 font-body text-[11px] text-bone-dim transition-colors hover:border-bone/35 hover:text-bone disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`Remove “${project.title}” from the homepage?`)) return;
                      setDraft((prev) => prev.filter((p) => p.id !== project.id));
                    }}
                    className="border border-transparent px-2.5 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-bone-dim transition-colors hover:border-blood-700/60 hover:text-blood-300"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {open ? (
                <div className="grid gap-5 border-t border-bone/10 px-5 py-5 lg:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor={`p-title-${project.id}`}>
                      Title
                    </label>
                    <input
                      id={`p-title-${project.id}`}
                      className={fieldClass}
                      value={project.title}
                      onChange={(e) => patch(project.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`p-category-${project.id}`}>
                      Category
                    </label>
                    <input
                      id={`p-category-${project.id}`}
                      className={fieldClass}
                      value={project.category}
                      onChange={(e) => patch(project.id, { category: e.target.value })}
                      placeholder="Product · Platform"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={labelClass} htmlFor={`p-desc-${project.id}`}>
                      Description
                    </label>
                    <textarea
                      id={`p-desc-${project.id}`}
                      rows={3}
                      className={`${fieldClass} resize-y`}
                      value={project.description}
                      onChange={(e) => patch(project.id, { description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`p-href-${project.id}`}>
                      Live URL
                    </label>
                    <input
                      id={`p-href-${project.id}`}
                      className={fieldClass}
                      value={project.href ?? ""}
                      onChange={(e) =>
                        patch(project.id, { href: e.target.value.trim(), live: Boolean(e.target.value.trim()) })
                      }
                      placeholder="https://…"
                      spellCheck={false}
                    />
                    <p className="mt-2 font-body text-[10px] text-bone-dim">
                      Leave empty and the card shows as a case study with no link.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`p-image-${project.id}`}>
                      Preview image path
                    </label>
                    <input
                      id={`p-image-${project.id}`}
                      className={fieldClass}
                      value={project.image}
                      onChange={(e) => patch(project.id, { image: e.target.value })}
                      placeholder="assets/featured/01-study-hub.svg"
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`p-parent-${project.id}`}>
                      Parent project (optional)
                    </label>
                    <input
                      id={`p-parent-${project.id}`}
                      className={fieldClass}
                      value={project.parent ?? ""}
                      onChange={(e) => patch(project.id, { parent: e.target.value })}
                      placeholder="Study Hub"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`p-accent-${project.id}`}>
                      Accent word
                    </label>
                    <input
                      id={`p-accent-${project.id}`}
                      className={fieldClass}
                      value={project.accent}
                      onChange={(e) => patch(project.id, { accent: e.target.value })}
                      placeholder="Focus"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`p-stack-${project.id}`}>
                      Stack (comma separated)
                    </label>
                    <input
                      id={`p-stack-${project.id}`}
                      className={fieldClass}
                      value={project.stack.join(", ")}
                      onChange={(e) =>
                        patch(project.id, {
                          stack: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="React, TypeScript, Vite"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={labelClass} htmlFor={`p-highlights-${project.id}`}>
                      Highlights (one per line)
                    </label>
                    <textarea
                      id={`p-highlights-${project.id}`}
                      rows={3}
                      className={`${fieldClass} resize-y`}
                      value={project.highlights.join("\n")}
                      onChange={(e) =>
                        patch(project.id, {
                          highlights: e.target.value
                            .split("\n")
                            .map((h) => h.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>

                  <label className="flex items-center gap-3 font-body text-[11px] uppercase tracking-wide2 text-bone-muted">
                    <input
                      type="checkbox"
                      checked={project.showInLiveStrip}
                      onChange={(e) => patch(project.id, { showInLiveStrip: e.target.checked })}
                      className="h-4 w-4 accent-[rgb(var(--blood-500-rgb))]"
                    />
                    Show in the “Live on the web” strip
                  </label>

                  <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
                    {project.href ? (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-bone/15 px-4 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
                      >
                        Test the link ↗
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        const original = DEFAULT_SITE_DATA.projects.find((p) => p.id === project.id);
                        if (original) patch(project.id, original);
                      }}
                      className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
                    >
                      Restore this card
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
