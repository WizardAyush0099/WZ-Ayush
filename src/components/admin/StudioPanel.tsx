import { useEffect, useMemo, useRef, useState } from "react";
import {
  ANIMATION_LABELS,
  ANIMATION_ORDER,
  IMAGE_SECTIONS,
  defaultFilm,
  slotId,
  type ImageSlot,
  type SlotAnimation,
  type SlotFilm,
} from "../../data/imageSlots";
import { PAGE_SECTIONS, parseSlotPoint, pointsByGroup } from "../../data/tunePoints";
import {
  BOX_FIELDS,
  EFFECT_FIELDS,
  MOTION_FIELDS,
  normaliseStudio,
  boxOf,
  isTuned,
  pointOf,
  type Stage,
  type TuneBox,
  type StudioDoc,
} from "../../lib/studio";
import {
  exportSiteDataJson,
  isRemoteSiteDataEnabled,
  publishSiteData,
  resetSiteData,
  updateConfig,
  updateSlot,
  updateStudio,
  useSiteData,
} from "../../lib/siteData";
import SlotMedia from "../media/SlotMedia";
import StageEditor from "./StageEditor";

/**
 * ============================================================================
 *  STUDIO — adjust any point of the site, from the site
 * ============================================================================
 *  The Images tab edits a picture in a named slot. This tab edits *everything*
 *  else, and it works the way an owner actually thinks about a page:
 *
 *    the frame on the left IS the site — the real homepage, running, with the
 *    same store this dashboard writes to. With pick mode on, hovering outlines
 *    whatever is under the pointer (a section, a row, a heading, a picture, a
 *    3D run) and tapping it selects it.
 *
 *    the panel on the right is that thing's controls: switch it off, crop it,
 *    enlarge it, resize it, move it, soften it, round it. Nothing here is a
 *    mock-up — every slider writes the document the page is reading, so the
 *    frame changes as the slider moves.
 *
 *  Six sub-tabs, one document:
 *
 *    Points    anything on the page (sections, items, pictures)
 *    3D runs   folders of frames, placed at a point, at a size and a speed
 *    Motion    the speeds of the built-in choreography, including the hero's
 *    Effects   atmosphere, cursor, opening counter, sound, smooth scrolling
 *    Layout    the order of the sections, and which ones are shown
 *    Document  export it for the repository, or paste one back in
 *
 *  Publishing is the Images tab's button, unchanged: this document rides in the
 *  same payload (`config.studio`), so one press carries the lot to every
 *  visitor. Without a backend it lives in this browser, and “Copy the document”
 *  hands you the JSON to commit.
 * ============================================================================
 */

type SubTab = "points" | "scroll" | "motion" | "effects" | "layout" | "json";

const SUB_TABS: Array<{ id: SubTab; label: string; hint: string }> = [
  { id: "points", label: "Points", hint: "Pick anything in the frame and adjust it — crop, enlarge, move, resize, switch off." },
  { id: "scroll", label: "3D runs", hint: "Play a folder of frames at a chosen point, at the size and speed you set." },
  { id: "motion", label: "Motion", hint: "How fast the built-in choreography runs, including the hero's own film." },
  { id: "effects", label: "Effects", hint: "Switches for the atmosphere, the cursor, the opening counter and sound." },
  { id: "layout", label: "Layout", hint: "The order of the page's sections — and which of them are shown at all." },
  { id: "json", label: "Document", hint: "Copy the document into the repository, or paste one back in." },
];

const field =
  "w-full border border-bone/15 bg-ink-950 px-3 py-2 font-mono text-[11px] text-bone placeholder:text-bone-dim focus:border-blood-500/70 focus:outline-none";
const label = "mb-1.5 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim";
const chip =
  "border border-bone/15 px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone";

type Status = { ok: boolean; detail: string } | null;
type Device = "desktop" | "tablet" | "phone";

const DEVICES: Array<{ id: Device; label: string; width: number }> = [
  { id: "desktop", label: "Desktop", width: 0 },
  { id: "tablet", label: "Tablet", width: 834 },
  { id: "phone", label: "Phone", width: 390 },
];

export default function StudioPanel({ onOpenImages }: { onOpenImages: () => void }) {
  const site = useSiteData();
  const doc = site.studio;
  const [tab, setTab] = useState<SubTab>("points");
  const [selected, setSelected] = useState("sec-hero");
  const [device, setDevice] = useState<Device>("desktop");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /* --------------------------------------------------------------- pick mode */

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string; id?: string } | null;
      if (!data || data.source !== "wz-studio" || data.type !== "pick" || !data.id) return;
      setSelected(data.id);
      setTab("points");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const jump = (pointId: string) => {
    frameRef.current?.contentWindow?.postMessage(
      { source: "wz-studio-host", type: "scrollTo", id: pointId },
      "*",
    );
  };

  /* ------------------------------------------------------------------ actions */

  const publish = async () => {
    setBusy(true);
    const result = await publishSiteData();
    setStatus(result);
    setBusy(false);
  };

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return pointsByGroup()
      .map((group) => ({
        group: group.group,
        points: needle
          ? group.points.filter(
              (point) =>
                point.label.toLowerCase().includes(needle) ||
                point.id.includes(needle) ||
                group.group.toLowerCase().includes(needle),
            )
          : group.points,
      }))
      .filter((group) => group.points.length);
  }, [search]);

  const selectedPoint = pointOf(selected);
  const slotRef = parseSlotPoint(selected);
  const previewWidth = DEVICES.find((entry) => entry.id === device)?.width ?? 0;
  const showPreview = tab === "points" || tab === "scroll";

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------------------ header */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="flex flex-col gap-4 border-b border-bone/10 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              The page, as a document
            </h2>
            <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
              Point at anything in the frame and change it. Every control writes the same document the
              site reads, so the frame updates as you drag; <span className="text-bone">Publish</span>{" "}
              sends it to every visitor, and{" "}
              <span className="text-bone">Copy the document</span> hands you the JSON to commit for
              good. Switching a point off removes it from the page entirely — nothing here is a
              mock-up.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void publish()}
              className="border border-blood-600/70 bg-blood-600/10 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-500 hover:bg-blood-600/20 disabled:opacity-40"
            >
              {busy ? "Publishing…" : "Publish for every visitor"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("json");
                setStatus(null);
              }}
              className={chip}
            >
              Copy the document
            </button>
          </div>
        </header>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-1 px-4 pt-3">
          {SUB_TABS.map((entry) => {
            const active = entry.id === tab;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                aria-current={active ? "page" : undefined}
                className={`relative px-4 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 transition-colors duration-300 ${
                  active ? "text-bone" : "text-bone-dim hover:text-bone-muted"
                }`}
              >
                {entry.label}
                <span
                  className={`absolute inset-x-3 -bottom-px h-px bg-blood-500 transition-transform duration-500 ease-silk ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="border-t border-bone/10 px-5 py-3 font-body text-[11px] leading-relaxed text-bone-dim">
          {SUB_TABS.find((entry) => entry.id === tab)?.hint}
        </p>
      </section>

      {status ? (
        <p
          className={`border px-4 py-3 font-body text-xs leading-relaxed ${
            status.ok
              ? "border-emerald-400/40 bg-emerald-950/20 text-emerald-200/90"
              : "border-blood-600/50 bg-blood-950/40 text-blood-200"
          }`}
        >
          {status.detail}
        </p>
      ) : null}

      {/* ----------------------------------------------------------- the frame */}
      <div className={showPreview ? "" : "hidden"}>
        <div className="flex flex-wrap items-center justify-between gap-3 border border-bone/10 border-b-0 bg-ink-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              Live preview
            </span>
            <span className="font-body text-[10px] text-blood-500/80">
              {selectedPoint?.label ?? selected}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {DEVICES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={device === entry.id}
                onClick={() => setDevice(entry.id)}
                className={`border px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                  device === entry.id
                    ? "border-blood-500/70 bg-blood-950/30 text-bone"
                    : "border-bone/15 text-bone-dim hover:border-bone/35"
                }`}
              >
                {entry.label}
              </button>
            ))}
            <button type="button" onClick={() => jump(selected)} className={chip}>
              Walk to it
            </button>
          </div>
        </div>
        <div className="border border-bone/10 bg-ink-950 p-3">
          <div
            className="mx-auto overflow-hidden border border-bone/10 bg-ink-950"
            style={previewWidth ? { width: previewWidth, maxWidth: "100%" } : undefined}
          >
            {/* `?pick=1` is what turns the frame's own pointer into a picker. */}
            <iframe
              ref={frameRef}
              src={`${import.meta.env.BASE_URL}?pick=1#/`}
              title="Live site preview"
              className="block h-[70svh] w-full border-0 bg-ink-950"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- points */}
      {tab === "points" ? (
        <div className="grid gap-6 xl:grid-cols-12">
          <section className="xl:col-span-5">
            <div className="border border-bone/10 bg-ink-900">
              <header className="border-b border-bone/10 px-4 py-3">
                <label className={label} htmlFor="studio-search">
                  Find a point
                </label>
                <input
                  id="studio-search"
                  className={field}
                  value={search}
                  placeholder="headline, archive, slot 02…"
                  spellCheck={false}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </header>
              <div className="max-h-[52svh] overflow-y-auto p-3">
                {groups.map((group) => (
                  <div key={group.group} className="mb-4">
                    <p className="px-1 pb-2 font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
                      {group.group}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {group.points.map((point) => {
                        const active = point.id === selected;
                        const tuned = isTuned(doc, point.id);
                        return (
                          <li key={point.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelected(point.id);
                                jump(point.id);
                              }}
                              className={`flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition-colors ${
                                active
                                  ? "border-blood-500/70 bg-blood-950/30"
                                  : "border-bone/10 hover:border-bone/30"
                              }`}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-body text-[11px] text-bone">
                                  {point.label}
                                </span>
                                <span className="block truncate font-mono text-[10px] text-bone-dim">
                                  {point.id}
                                </span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                {tuned ? (
                                  <span className="font-body text-[9px] uppercase tracking-wide2 text-blood-400">
                                    edited
                                  </span>
                                ) : null}
                                <span className="font-body text-[9px] uppercase tracking-wide2 text-bone-dim">
                                  {point.kind}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {groups.length === 0 ? (
                  <p className="px-1 py-4 font-body text-xs text-bone-dim">Nothing matches that.</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="xl:col-span-7">
            {slotRef ? (
              <SlotInspector
                slotId={slotId(slotRef.section, slotRef.index)}
                label={selectedPoint?.label ?? selected}
                onOpenImages={onOpenImages}
              />
            ) : (
              <BoxInspector
                doc={doc}
                pointId={selected}
                label={selectedPoint?.label ?? selected}
                hint={selectedPoint?.hint}
                transform={selectedPoint ? selectedPoint.transform : true}
              />
            )}
          </section>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- 3D runs */}
      {tab === "scroll" ? (
        <div className="flex flex-col gap-6">
          <HeroFilm />
          <StageEditor
            stages={doc.stages}
            onChange={(stages: Stage[]) => updateStudio({ stages })}
            onJump={(sectionId) => jump(`sec-${sectionId}`)}
          />
        </div>
      ) : null}

      {/* ----------------------------------------------------------- motion */}
      {tab === "motion" ? (
        <section className="border border-bone/10 bg-ink-900">
          <header className="border-b border-bone/10 px-5 py-4">
            <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              Motion
            </h2>
            <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
              The speeds of the choreography that ships with the site — the opening film's own run,
              the camera push, the pointer depth, the mark that winds with the scroll and the pinned
              shelf. Calmer for a quiet brand, faster for a reel.
            </p>
          </header>
          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {MOTION_FIELDS.map((cfg) => (
              <div key={cfg.key}>
                <label className={label} htmlFor={`motion-${cfg.key}`}>
                  {cfg.label} ·{" "}
                  <span className="text-bone-muted">
                    {Number(doc.motion[cfg.key]).toFixed(cfg.step < 1 ? 2 : 0)}
                  </span>
                </label>
                <input
                  id={`motion-${cfg.key}`}
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={doc.motion[cfg.key]}
                  className="w-full accent-[#d61f26]"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    updateStudio({ motion: { ...doc.motion, [cfg.key]: value } });
                    // The run's length is also a field on the Artwork tab; keep
                    // the two doors onto the same number in step.
                    if (cfg.key === "heroScrollVh") {
                      updateConfig({ media: { ...site.media, scrollLength: `${value.toFixed(1)}vh` } });
                    }
                  }}
                />
                <p className="mt-1.5 font-body text-[11px] leading-relaxed text-bone-dim">{cfg.hint}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- effects */}
      {tab === "effects" ? (
        <section className="border border-bone/10 bg-ink-900">
          <header className="border-b border-bone/10 px-5 py-4">
            <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Effects</h2>
            <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
              One switch per atmosphere layer. A layer switched off is never mounted, so turning the
              embers or the custom cursor off costs nothing to run rather than being drawn at zero.
            </p>
          </header>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {EFFECT_FIELDS.map((cfg) => {
              const on = doc.effects[cfg.key];
              return (
                <button
                  key={cfg.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    updateStudio({ effects: { ...doc.effects, [cfg.key]: !on } });
                  }}
                  className={`border p-4 text-left transition-colors duration-300 ${
                    on ? "border-blood-500/70 bg-blood-950/25" : "border-bone/15 hover:border-bone/35"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-body text-[11px] uppercase tracking-wide2 text-bone">
                      {cfg.label}
                    </span>
                    <span
                      className={`font-body text-[10px] uppercase tracking-wide2 ${
                        on ? "text-emerald-200/90" : "text-bone-dim"
                      }`}
                    >
                      {on ? "On" : "Off"}
                    </span>
                  </span>
                  <span className="mt-2 block font-body text-[11px] leading-relaxed text-bone-dim">
                    {cfg.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ layout */}
      {tab === "layout" ? (
        <section className="border border-bone/10 bg-ink-900">
          <header className="border-b border-bone/10 px-5 py-4">
            <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Layout</h2>
            <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
              The page renders in this order. Move a band with the arrows, or switch one off — a
              hidden section renders nothing at all, so the page around it closes up.
            </p>
          </header>
          <ol className="divide-y divide-bone/10">
            {doc.order.map((id, index) => {
              const meta = PAGE_SECTIONS.find((section) => section.id === id);
              if (!meta) return null;
              const hidden = doc.hidden.includes(id);
              const move = (delta: number) => {
                const next = [...doc.order];
                const target = index + delta;
                if (target < 0 || target >= next.length) return;
                [next[index], next[target]] = [next[target], next[index]];
                updateStudio({ order: next });
              };
              return (
                <li key={id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="font-mono text-[11px] text-blood-500/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate font-body text-[11px] uppercase tracking-wide2 ${
                          hidden ? "text-bone-dim line-through" : "text-bone"
                        }`}
                      >
                        {meta.label}
                      </span>
                      <span className="block truncate font-body text-[11px] text-bone-dim">
                        {meta.hint}
                      </span>
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => move(-1)} className={chip} aria-label="Move up">
                      ↑
                    </button>
                    <button type="button" onClick={() => move(1)} className={chip} aria-label="Move down">
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-pressed={hidden}
                      onClick={() =>
                        updateStudio({
                          hidden: hidden
                            ? doc.hidden.filter((item) => item !== id)
                            : [...doc.hidden, id],
                        })
                      }
                      className={`border px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                        hidden ? "border-bone/20 text-bone-dim" : "border-emerald-400/40 text-emerald-200/90"
                      }`}
                    >
                      {hidden ? "Show" : "Hide"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- document */}
      {tab === "json" ? <DocumentTab onStatus={setStatus} /> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  The hero's own film                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The opening run is not a stage — it is the page's own hero, and it lives in
 * the Artwork tab's media config. It is edited here too, because this is the
 * tab about runs: the same folder/count/extension shape, the same renderer, and
 * the Motion tab right beside it controls how it plays.
 */
function HeroFilm() {
  const site = useSiteData();
  const media = site.media;
  const frames = media.mode === "sequence";

  return (
    <section className="border border-bone/10 bg-ink-900">
      <header className="border-b border-bone/10 px-5 py-4">
        <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
          The hero's own run
        </h2>
        <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
          {frames
            ? "The opening film, as a folder of frames scrubbed by the scroll. Its length, scrub, push-in and parallax are on the Motion tab."
            : "The hero is not currently a frame run — it is set to the procedural scene or a video. Switch it back from the Artwork tab, or from the button below."}
        </p>
      </header>
      <div className="flex flex-col gap-4 p-5">
        {frames ? (
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="hero-dir">
                Frame folder
              </label>
              <input
                id="hero-dir"
                className={field}
                value={media.frameDir}
                spellCheck={false}
                onChange={(event) => updateConfig({ media: { ...media, frameDir: event.target.value } })}
              />
            </div>
            <div>
              <label className={label} htmlFor="hero-count">
                Frames
              </label>
              <input
                id="hero-count"
                type="number"
                min={1}
                max={600}
                className={field}
                value={media.frameCount}
                onChange={(event) =>
                  updateConfig({ media: { ...media, frameCount: Number(event.target.value) } })
                }
              />
            </div>
            <div>
              <label className={label} htmlFor="hero-ext">
                Extension
              </label>
              <select
                id="hero-ext"
                className={field}
                value={media.frameExt}
                onChange={(event) =>
                  updateConfig({ media: { ...media, frameExt: event.target.value as typeof media.frameExt } })
                }
              >
                {["jpg", "webp", "png", "avif"].map((ext) => (
                  <option key={ext} value={ext}>
                    {ext}
                  </option>
                ))}
              </select>
            </div>
            <p className="font-body text-[11px] leading-relaxed text-bone-dim sm:col-span-4">
              Frames are read as{" "}
              <code className="text-bone-muted">
                {media.frameDir || "assets/hero-sequence"}/000.{media.frameExt}
              </code>{" "}
              — the folder the .zip was extracted into. The poster and the source note live on the
              Artwork tab.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => updateConfig({ media: { ...media, mode: "sequence" } })}
            className="w-fit border border-blood-600/70 bg-blood-600/10 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-500 hover:bg-blood-600/20"
          >
            Make the hero a frame run
          </button>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  The inspector — one point's box                                           */
/* -------------------------------------------------------------------------- */

/** A record without one key, without mutating the original. */
function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function BoxInspector({
  doc,
  pointId,
  label: labelText,
  hint,
  transform,
}: {
  doc: StudioDoc;
  pointId: string;
  label: string;
  hint?: string;
  transform: boolean;
}) {
  const box = boxOf(doc, pointId);
  const point = pointOf(pointId);
  const set = (patch: Partial<TuneBox>) => {
    updateStudio({ boxes: { ...doc.boxes, [pointId]: { ...box, ...patch } } });
  };
  /** Scale and nudge are refused where a transform would break a pinned band. */
  const hidden = transform ? [] : ["scale", "moveX", "moveY", "rotate"];

  return (
    <section className="border border-bone/10 bg-ink-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-body text-[11px] uppercase tracking-wide2 text-bone">{labelText}</h2>
          <p className="font-mono text-[10px] text-bone-dim">{pointId}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={box.on}
            onClick={() => set({ on: !box.on })}
            className={`border px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
              box.on ? "border-emerald-400/40 text-emerald-200/90" : "border-bone/20 text-bone-dim"
            }`}
          >
            {box.on ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={() => updateStudio({ boxes: without(doc.boxes, pointId) })}
            className={chip}
          >
            Reset
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-5 p-4">
        {hint ? (
          <p className="font-body text-[11px] leading-relaxed text-bone-dim">{hint}</p>
        ) : null}

        {box.on ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {BOX_FIELDS.map((cfg) => {
              if (hidden.includes(cfg.key)) return null;
              // The crop trio only means anything where there are pictures.
              if (!point?.pictures && (cfg.key === "zoom" || cfg.key === "posX" || cfg.key === "posY")) {
                return null;
              }
              return (
                <div key={cfg.key}>
                  <label className={label} htmlFor={`box-${pointId}-${cfg.key}`}>
                    {cfg.label} ·{" "}
                    <span className="text-bone-muted">
                      {Number(box[cfg.key]).toFixed(cfg.step < 1 ? 2 : 0)}
                    </span>
                  </label>
                  <input
                    id={`box-${pointId}-${cfg.key}`}
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={box[cfg.key]}
                    className="w-full accent-[#d61f26]"
                    onChange={(event) => set({ [cfg.key]: Number(event.target.value) } as Partial<TuneBox>)}
                  />
                  <p className="mt-1.5 font-body text-[11px] leading-relaxed text-bone-dim">{cfg.hint}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="font-body text-xs leading-relaxed text-bone-muted">
            This point is switched off — it renders nothing at all. Turn it back on to adjust it.
          </p>
        )}

        {!transform ? (
          <p className="border border-bone/10 bg-ink-950 px-4 py-3 font-body text-[11px] leading-relaxed text-bone-dim">
            This band holds a pinned element, so size, crop, opacity, blur and radius are offered but
            scale and nudge are not: a transform here would turn the pin's{" "}
            <code className="text-bone-muted">position: fixed</code> into a lie and tear the page as
            it scrolls.
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  The inspector — one picture                                               */
/* -------------------------------------------------------------------------- */

/**
 * A picture point edits its *slot*, not a box: the slot is the document the
 * Images tab writes and the site's `SlotMedia` draws, so there is exactly one
 * place a picture's crop, size and film are stored. The full editor (captions,
 * alt text, limits, the blurred backdrop colour) stays on the Images tab — this
 * is the crop-and-size half of it, next to the frame it changes.
 */
function SlotInspector({
  slotId: id,
  label: labelText,
  onOpenImages,
}: {
  slotId: string;
  label: string;
  onOpenImages: () => void;
}) {
  const site = useSiteData();
  const slot = site.slots.find((entry) => entry.id === id);

  if (!slot) {
    return (
      <section className="border border-bone/10 bg-ink-900 p-5">
        <p className="font-body text-xs text-bone-muted">
          No slot is registered as <code className="text-bone">{id}</code>.
        </p>
      </section>
    );
  }

  const set = (patch: Partial<ImageSlot>) => updateSlot(id, patch);
  const sectionLabel =
    IMAGE_SECTIONS.find((entry) => entry.id === slot.section)?.label ?? slot.section;

  return (
    <section className="border border-bone/10 bg-ink-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-body text-[11px] uppercase tracking-wide2 text-bone">{labelText}</h2>
          <p className="font-mono text-[10px] text-bone-dim">
            {sectionLabel} · {id}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={slot.enabled}
            onClick={() => set({ enabled: !slot.enabled })}
            className={`border px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
              slot.enabled ? "border-emerald-400/40 text-emerald-200/90" : "border-bone/20 text-bone-dim"
            }`}
          >
            {slot.enabled ? "On" : "Off"}
          </button>
          <button type="button" onClick={onOpenImages} className={chip}>
            Full editor
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-5 p-4">
        <div className="border border-bone/10 bg-ink-950 p-3">
          <SlotMedia slot={slot} aspect="aspect-[4/3]" className="border border-bone/10" />
        </div>

        <div>
          <label className={label} htmlFor={`slot-src-${id}`}>
            Picture — a path in the repository, or a full URL
          </label>
          <input
            id={`slot-src-${id}`}
            className={field}
            defaultValue={slot.src}
            placeholder="assets/archive/hero.webp"
            spellCheck={false}
            onBlur={(event) => set({ src: event.target.value.trim() })}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                set({ src: (event.target as HTMLInputElement).value.trim() });
                (event.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              ["zoom", "Enlarge / crop (×)", 1, 4, 0.01],
              ["posX", "Crop across (%)", 0, 100, 1],
              ["posY", "Crop down (%)", 0, 100, 1],
              ["width", "Width (%)", 20, 100, 1],
              ["height", "Height (px, 0 = natural)", 0, 1200, 10],
              ["opacity", "Opacity", 0.1, 1, 0.05],
              ["radius", "Rounded corners (px)", 0, 64, 1],
              ["blur", "Blurred backdrop (px)", 0, 24, 1],
            ] as const
          ).map(([key, text, min, max, step]) => (
            <div key={key}>
              <label className={label} htmlFor={`slot-${key}-${id}`}>
                {text} ·{" "}
                <span className="text-bone-muted">
                  {Number(slot[key]).toFixed(step < 1 ? 2 : 0)}
                </span>
              </label>
              <input
                id={`slot-${key}-${id}`}
                type="range"
                min={min}
                max={max}
                step={step}
                value={slot[key]}
                className="w-full accent-[#d61f26]"
                onChange={(event) => set({ [key]: Number(event.target.value) } as Partial<ImageSlot>)}
              />
            </div>
          ))}

          <div>
            <label className={label} htmlFor={`slot-animation-${id}`}>
              How it moves
            </label>
            <select
              id={`slot-animation-${id}`}
              className={field}
              value={slot.animation}
              onChange={(event) => set({ animation: event.target.value as SlotAnimation })}
            >
              {ANIMATION_ORDER.map((animation) => (
                <option key={animation} value={animation}>
                  {ANIMATION_LABELS[animation]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* The film half: point this picture at a folder of frames. */}
        <div className="border border-bone/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className={label}>Scroll film — play a run inside this frame</span>
            <button
              type="button"
              onClick={() =>
                set({
                  film: slot.film ? null : { ...defaultFilm },
                  animation: slot.film ? "reveal" : "film",
                })
              }
              className={chip}
            >
              {slot.film ? "Remove the film" : "Make it a film"}
            </button>
          </div>

          {slot.film ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={label} htmlFor={`slot-film-dir-${id}`}>
                  Frame folder
                </label>
                <input
                  id={`slot-film-dir-${id}`}
                  className={field}
                  defaultValue={slot.film.dir}
                  spellCheck={false}
                  onBlur={(event) =>
                    set({ film: { ...(slot.film as SlotFilm), dir: event.target.value.trim() } })
                  }
                />
              </div>
              <div>
                <label className={label} htmlFor={`slot-film-count-${id}`}>
                  Frames
                </label>
                <input
                  id={`slot-film-count-${id}`}
                  type="number"
                  min={1}
                  max={600}
                  className={field}
                  value={slot.film.count}
                  onChange={(event) =>
                    set({ film: { ...(slot.film as SlotFilm), count: Number(event.target.value) } })
                  }
                />
              </div>
              <div>
                <label className={label} htmlFor={`slot-film-ext-${id}`}>
                  Extension
                </label>
                <select
                  id={`slot-film-ext-${id}`}
                  className={field}
                  value={slot.film.ext}
                  onChange={(event) =>
                    set({
                      film: { ...(slot.film as SlotFilm), ext: event.target.value as SlotFilm["ext"] },
                    })
                  }
                >
                  {["jpg", "webp", "png", "avif"].map((ext) => (
                    <option key={ext} value={ext}>
                      {ext}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor={`slot-film-from-${id}`}>
                    Plays from (0–1) · <span className="text-bone-muted">{slot.filmFrom}</span>
                  </label>
                  <input
                    id={`slot-film-from-${id}`}
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={slot.filmFrom}
                    className="w-full accent-[#d61f26]"
                    onChange={(event) =>
                      set({ filmFrom: Math.min(Number(event.target.value), slot.filmTo) })
                    }
                  />
                </div>
                <div>
                  <label className={label} htmlFor={`slot-film-to-${id}`}>
                    Plays to (0–1) · <span className="text-bone-muted">{slot.filmTo}</span>
                  </label>
                  <input
                    id={`slot-film-to-${id}`}
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={slot.filmTo}
                    className="w-full accent-[#d61f26]"
                    onChange={(event) =>
                      set({ filmTo: Math.max(Number(event.target.value), slot.filmFrom) })
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 font-body text-[11px] leading-relaxed text-bone-dim">
              A film is a folder of stills scrubbed by the scroll — the same mechanic as the hero's
              opening run, with no video file. Frames must be zero-padded to three digits and start
              at <code className="text-bone-muted">000</code>.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  The document                                                              */
/* -------------------------------------------------------------------------- */

function DocumentTab({ onStatus }: { onStatus: (status: Status) => void }) {
  const [draft, setDraft] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportSiteDataJson());
      onStatus({
        ok: true,
        detail:
          "Copied. Paste studioDefaults into src/data/studioDefaults.ts (and the other keys into content.ts / imageSlots.ts) to make it permanent in the repository.",
      });
    } catch {
      onStatus({ ok: false, detail: "Clipboard unavailable — select the JSON below by hand." });
    }
  };

  const apply = () => {
    try {
      const parsed = JSON.parse(draft) as { studioDefaults?: unknown };
      const source = parsed && typeof parsed === "object" && "studioDefaults" in parsed
        ? parsed.studioDefaults
        : parsed;
      updateStudio(normaliseStudio(source));
      onStatus({ ok: true, detail: "Pasted document applied. Publish to send it to every visitor." });
    } catch {
      onStatus({ ok: false, detail: "That is not valid JSON — nothing was applied." });
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="border border-bone/10 bg-ink-900">
        <header className="border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            The document
          </h2>
          <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
            Everything on this tab is one JSON object. Copy it into the repository to make it the
            committed default for every hosting target, or paste one back to restore a version you
            kept.
            {isRemoteSiteDataEnabled
              ? " A shared backend is configured, so Publish also reaches visitors."
              : " No shared backend is configured for this build, so this browser and the repository are the only homes it has."}
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-3 p-5">
          <button
            type="button"
            onClick={() => void copy()}
            className="border border-blood-600/70 bg-blood-600/10 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-500 hover:bg-blood-600/20"
          >
            Copy the document
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Restore every section, picture, run and speed committed in the source? This cannot be undone.",
                )
              ) {
                resetSiteData();
                onStatus({ ok: true, detail: "Every committed default is back." });
              }
            }}
            className="border border-blood-800/60 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-blood-400/80 transition-colors hover:border-blood-600 hover:text-blood-300"
          >
            Restore committed defaults
          </button>
        </div>
      </div>

      <div className="border border-bone/10 bg-ink-900">
        <header className="border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Paste a document back
          </h2>
        </header>
        <div className="flex flex-col gap-3 p-5">
          <textarea
            className={`${field} h-48 resize-y`}
            value={draft}
            spellCheck={false}
            placeholder='{"boxes":{…},"stages":[…],"motion":{…},"effects":{…}}'
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={apply}
              className="border border-bone/20 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/40 hover:text-bone disabled:opacity-40"
            >
              Apply it
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(exportSiteDataJson()).catch(() => undefined)}
              className={chip}
            >
              Copy the current document instead
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
