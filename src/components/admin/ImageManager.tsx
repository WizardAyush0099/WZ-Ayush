import { useRef, useState } from "react";
import {
  ANIMATION_LABELS,
  ANIMATION_ORDER,
  IMAGE_SECTIONS,
  defaultFilm,
  type ImageSectionId,
  type ImageSlot,
  type SlotAnimation,
  type SlotFilm,
} from "../../data/imageSlots";
import {
  publishSiteData,
  exportSiteDataJson,
  isRemoteSiteDataEnabled,
  resetSiteData,
  updateSlot,
  useSectionSlots,
} from "../../lib/siteData";
import { useStoredImages } from "../../lib/imageStore";
import { track } from "../../lib/telemetry";
import { linkTo } from "../../lib/router";
import SlotMedia from "../media/SlotMedia";

/**
 * ============================================================================
 *  IMAGES — the section-wise manager
 * ============================================================================
 *  Every picture the site renders is a numbered slot inside a section:
 *
 *    Hero            the planes behind the opening film
 *    Studio          the tall picture beside “How I Work”
 *    The Archive     slots 01–03 the wide stills, 04–09 the tiles
 *    Featured work   one slot per live project card, in card order
 *
 *  The workflow is the one the owner asked for: upload the file to GitHub,
 *  copy its path, paste it into the slot, save. Each slot also carries the
 *  properties that used to be hard-coded — animation, opacity, the blurred
 *  backdrop, the colour behind the frame and the frame's width and height — and
 *  edits apply to the page immediately, so the preview beside every field is
 *  the real thing.
 *
 *  Paths are normalised exactly like the Artwork tab: `assets/hero.webp`
 *  (repo-relative, the portable one), `/WZ-Ayush/assets/hero.webp` (absolute)
 *  or any full `https://` URL.
 * ============================================================================
 */

type Status = { ok: boolean; detail: string } | null;

const field =
  "w-full border border-bone/15 bg-ink-950 px-3 py-2 font-mono text-[11px] text-bone placeholder:text-bone-dim focus:border-blood-500/70 focus:outline-none";
const label = "mb-1.5 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim";
const SWATCHES = ["", "#0a0709", "#120a0c", "#1a0f12", "transparent"];

export default function ImageManager() {
  const [section, setSection] = useState<ImageSectionId>("archive");
  const slots = useSectionSlots(section);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const meta = IMAGE_SECTIONS.find((entry) => entry.id === section)!;

  const publish = async () => {
    setBusy(true);
    const result = await publishSiteData();
    setStatus(result);
    setBusy(false);
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportSiteDataJson());
      setStatus({
        ok: true,
        detail:
          "Copied. Paste imageSlotDefaults (and assetDefaults / mediaDefaults / projects) back into src/data/imageSlots.ts and src/data/content.ts to make it permanent in the repository.",
      });
    } catch {
      setStatus({ ok: false, detail: "Clipboard unavailable in this browser." });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ------------------------------------------------------ section picker */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Sections
          </h2>
          <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
            Pick the part of the page you are changing, then fill its slots — up to nine each.
            Upload the file to your repository under <code className="text-bone">public/assets/</code>{" "}
            and paste its path here. Changes show on the page immediately; press{" "}
            <span className="text-bone">Publish</span> to send them to every visitor.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 p-5">
          {IMAGE_SECTIONS.map((entry) => {
            const active = entry.id === section;
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSection(entry.id)}
                className={`border px-4 py-3 text-left transition-colors duration-300 ${
                  active ? "border-blood-500/70 bg-blood-950/30" : "border-bone/15 hover:border-bone/35"
                }`}
              >
                <span className="block font-body text-[11px] uppercase tracking-wide2 text-bone">
                  {entry.label}
                </span>
                <span className="mt-1 block max-w-[34ch] font-body text-[11px] leading-relaxed text-bone-dim">
                  {entry.hint}
                </span>
              </button>
            );
          })}
        </div>

        <p className="border-t border-bone/10 px-5 py-4 font-body text-[11px] leading-relaxed text-bone-dim">
          {meta.usage}
        </p>
      </section>

      {/* ------------------------------------------------------------- actions */}
      <div className="flex flex-wrap items-center gap-3">
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
          onClick={() => void copyJson()}
          className="border border-bone/15 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
        >
          Copy JSON for the repo
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Restore every section to the images committed in the source?")) {
              resetSiteData();
              setStatus({ ok: true, detail: "Restored the committed defaults." });
            }
          }}
          className="border border-blood-800/60 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-blood-400/80 transition-colors hover:border-blood-600 hover:text-blood-300"
        >
          Restore committed defaults
        </button>
      </div>

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

      {/* --------------------------------------------------------------- slots */}
      <div className="grid gap-6 xl:grid-cols-2">
        {slots.map((slot) => (
          <SlotEditor key={slot.id} slot={slot} />
        ))}
      </div>

      <p className="font-body text-xs leading-relaxed text-bone-dim">
        Without a shared backend these edits live in this browser only, and the committed files
        (<code className="text-bone-muted">src/data/imageSlots.ts</code>) stay the source of truth
        for visitors — use <span className="text-bone-muted">Copy JSON for the repo</span> to make
        them permanent
        {isRemoteSiteDataEnabled ? "." : " — no backend is configured for this build."} A slot that
        holds a film reads its frames as{" "}
        <code className="text-bone-muted">folder/000.jpg</code>, zero-padded to three digits,
        exactly like the hero's run.
      </p>

      <DeviceUploads />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  One slot                                                                  */
/* -------------------------------------------------------------------------- */

function SlotEditor({ slot }: { slot: ImageSlot }) {
  const [open, setOpen] = useState(false);
  const filled = slot.enabled && Boolean(slot.src || slot.film);

  const state = !slot.film && !slot.src
    ? "Empty"
    : slot.film
      ? `Film · ${slot.film.count} frames`
      : "Still";

  return (
    <section className="border border-bone/10 bg-ink-900">
      <header className="flex items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[11px] text-blood-500/80">
            {String(slot.index).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-body text-[11px] uppercase tracking-wide2 text-bone">
              {slot.caption || "Untitled slot"}
            </span>
            <span className="block font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              {state}
              {filled ? "" : " · hidden"}
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={slot.enabled}
            onClick={() => updateSlot(slot.id, { enabled: !slot.enabled })}
            className={`border px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
              slot.enabled
                ? "border-emerald-400/40 text-emerald-200/90"
                : "border-bone/20 text-bone-dim"
            }`}
          >
            {slot.enabled ? "On" : "Off"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="border border-bone/15 px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
          >
            {open ? "Close" : "Edit"}
          </button>
        </div>
      </header>

      <div className="p-4">
        {/* Preview — drawn by the same component the page uses, at the slot's
            own width, so what is in the card is what renders on the site. */}
        <div className="border border-bone/10 bg-ink-950 p-3">
          <SlotMedia slot={slot} aspect="aspect-[4/3]" className="border border-bone/10" />
        </div>

        <CommitField
          id={`src-${slot.id}`}
          label="Image path (GitHub → copy the path)"
          value={slot.src}
          placeholder="assets/archive/hero.webp"
          onCommit={(value) => updateSlot(slot.id, { src: value })}
        />

        {open ? (
          <div className="mt-5 flex flex-col gap-5">
            <CommitField
              id={`caption-${slot.id}`}
              label="Caption"
              value={slot.caption}
              placeholder="What the frame is"
              onCommit={(value) => updateSlot(slot.id, { caption: value })}
            />
            <CommitField
              id={`alt-${slot.id}`}
              label="Alt text (for screen readers)"
              value={slot.alt}
              placeholder="Short description of the picture"
              onCommit={(value) => updateSlot(slot.id, { alt: value })}
            />

            {/* Scroll film */}
            <div className="border border-bone/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className={label}>Scroll film (3D sequence)</span>
                <button
                  type="button"
                  onClick={() =>
                    updateSlot(slot.id, {
                      film: slot.film ? null : { ...defaultFilm },
                      animation: slot.film ? "reveal" : "film",
                    })
                  }
                  className="border border-bone/15 px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
                >
                  {slot.film ? "Remove film" : "Make this slot a film"}
                </button>
              </div>

              {slot.film ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <CommitField
                      id={`film-dir-${slot.id}`}
                      label="Frame folder"
                      value={slot.film.dir}
                      placeholder="assets/sequence"
                      onCommit={(value) =>
                        updateSlot(slot.id, {
                          film: value ? { ...slot.film!, dir: value } : slot.film,
                        })
                      }
                    />
                  </div>
                  <NumberField
                    id={`film-count-${slot.id}`}
                    label="Frames"
                    value={slot.film.count}
                    min={1}
                    max={600}
                    step={1}
                    onCommit={(value) => updateSlot(slot.id, { film: { ...slot.film!, count: value } })}
                  />
                  <div>
                    <label className={label} htmlFor={`film-ext-${slot.id}`}>
                      Extension
                    </label>
                    <select
                      id={`film-ext-${slot.id}`}
                      className={field}
                      value={slot.film.ext}
                      onChange={(event) =>
                        updateSlot(slot.id, {
                          film: { ...slot.film!, ext: event.target.value as SlotFilm["ext"] },
                        })
                      }
                    >
                      {["jpg", "jpeg", "webp", "png", "avif"].map((ext) => (
                        <option key={ext} value={ext}>
                          {ext}
                        </option>
                      ))}
                    </select>
                  </div>
                  <NumberField
                    id={`film-from-${slot.id}`}
                    label="Plays from (0–1)"
                    value={slot.filmFrom}
                    min={0}
                    max={1}
                    step={0.01}
                    onCommit={(value) =>
                      updateSlot(slot.id, { filmFrom: Math.min(value, slot.filmTo) })
                    }
                  />
                  <NumberField
                    id={`film-to-${slot.id}`}
                    label="Plays to (0–1)"
                    value={slot.filmTo}
                    min={0}
                    max={1}
                    step={0.01}
                    onCommit={(value) =>
                      updateSlot(slot.id, { filmTo: Math.max(value, slot.filmFrom) })
                    }
                  />
                </div>
              ) : (
                <p className="mt-3 font-body text-[11px] leading-relaxed text-bone-dim">
                  A film is a numbered folder of stills scrubbed by scroll — the same mechanic as the
                  hero's opening reel, with no video file. Frames must be zero-padded to three digits
                  and start at <code className="text-bone-muted">000</code>, e.g.{" "}
                  <code className="text-bone-muted">assets/sequence/000.webp</code>. A{" "}
                  <code className="text-bone-muted">.zip</code> is never read at runtime: extract the
                  archive into the repository first. The slot shows the poster until the first frame
                  is decoded, so set an image path too if the run is large.
                </p>
              )}
            </div>

            {/* Animation */}
            <div>
              <label className={label} htmlFor={`animation-${slot.id}`}>
                Animation
              </label>
              <select
                id={`animation-${slot.id}`}
                className={field}
                value={slot.animation}
                onChange={(event) =>
                  updateSlot(slot.id, { animation: event.target.value as SlotAnimation })
                }
              >
                {ANIMATION_ORDER.map((animation) => (
                  <option key={animation} value={animation}>
                    {ANIMATION_LABELS[animation]}
                  </option>
                ))}
              </select>
            </div>

            {/* Numbers */}
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                id={`opacity-${slot.id}`}
                label="Opacity"
                value={slot.opacity}
                min={0.1}
                max={1}
                step={0.05}
                onCommit={(value) => updateSlot(slot.id, { opacity: value })}
              />
              <NumberField
                id={`blur-${slot.id}`}
                label="Blur background (px)"
                value={slot.blur}
                min={0}
                max={24}
                step={1}
                onCommit={(value) => updateSlot(slot.id, { blur: value })}
              />
              <NumberField
                id={`width-${slot.id}`}
                label="Width (% of its column)"
                value={slot.width}
                min={20}
                max={100}
                step={5}
                onCommit={(value) => updateSlot(slot.id, { width: value })}
              />
              <NumberField
                id={`height-${slot.id}`}
                label="Height (px, 0 = natural)"
                value={slot.height}
                min={0}
                max={1200}
                step={10}
                onCommit={(value) => updateSlot(slot.id, { height: value })}
              />
              {/*
                The crop. `zoom` enlarges the picture inside its frame — which
                is what crops it — and the two position values say which part
                survives. A film crops identically, because its canvas draws
                with the same scale. The Studio tab reaches these same fields.
              */}
              <NumberField
                id={`zoom-${slot.id}`}
                label="Enlarge / crop (×)"
                value={slot.zoom}
                min={1}
                max={4}
                step={0.01}
                onCommit={(value) => updateSlot(slot.id, { zoom: value })}
              />
              <NumberField
                id={`posx-${slot.id}`}
                label="Crop across (%)"
                value={slot.posX}
                min={0}
                max={100}
                step={1}
                onCommit={(value) => updateSlot(slot.id, { posX: value })}
              />
              <NumberField
                id={`posy-${slot.id}`}
                label="Crop down (%)"
                value={slot.posY}
                min={0}
                max={100}
                step={1}
                onCommit={(value) => updateSlot(slot.id, { posY: value })}
              />
              <NumberField
                id={`radius-${slot.id}`}
                label="Rounded corners (px)"
                value={slot.radius}
                min={0}
                max={64}
                step={1}
                onCommit={(value) => updateSlot(slot.id, { radius: value })}
              />
            </div>

            <div>
              <label className={label} htmlFor={`background-${slot.id}`}>
                Background behind the frame
              </label>
              <input
                id={`background-${slot.id}`}
                className={field}
                value={slot.background}
                placeholder="theme default"
                spellCheck={false}
                onChange={(event) => updateSlot(slot.id, { background: event.target.value })}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {SWATCHES.map((swatch) => (
                  <button
                    key={swatch || "default"}
                    type="button"
                    onClick={() => updateSlot(slot.id, { background: swatch })}
                    className="h-6 w-6 border border-bone/20"
                    style={{ background: swatch || "rgb(var(--ink-950-rgb) / 1)" }}
                    aria-label={swatch ? `Set background ${swatch}` : "Use the theme default"}
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateSlot(slot.id, {
                      src: "",
                      film: null,
                      caption: "",
                      alt: "",
                      enabled: false,
                    })
                  }
                  className="ml-auto border border-blood-800/60 px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-blood-400/80 transition-colors hover:border-blood-600 hover:text-blood-300"
                >
                  Clear this slot
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fields                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A text field that commits on blur or Enter rather than on every keystroke —
 * a path is typed character by character, and committing each one would
 * re-render every frame on the page looking for a file that does not exist yet.
 */
function CommitField({
  id,
  label: labelText,
  value,
  placeholder,
  onCommit,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const lastValue = useRef(value);
  // Keep up with edits from elsewhere (restore defaults, imports).
  if (lastValue.current !== value) {
    lastValue.current = value;
    if (draft !== value) setDraft(value);
  }

  return (
    <div className="mt-4">
      <label className={label} htmlFor={id}>
        {labelText}
      </label>
      <input
        id={id}
        className={field}
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => onCommit(draft.trim())}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommit(draft.trim());
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

function NumberField({
  id,
  label: labelText,
  value,
  min,
  max,
  step,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (value: number) => void;
}) {
  return (
    <div>
      <label className={label} htmlFor={id}>
        {labelText} · <span className="text-bone-muted">{value}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full accent-[#d61f26]"
        onChange={(event) => onCommit(Number(event.target.value))}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quick add from this device                                                */
/* -------------------------------------------------------------------------- */

/**
 * The old uploader, kept as the fast path when the picture is already on the
 * phone: it resizes in the browser and renders in front of the Archive's tiles
 * with a “New” badge. It is per-device, which is exactly why the slots above
 * exist — a path in the repository reaches every visitor.
 */
function DeviceUploads() {
  const { images, loading, add, remove } = useStoredImages();
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files).filter((file) => file.type.startsWith("image/")) : [];
    if (!list.length) {
      setError("Drop an image file (PNG, JPG, WebP or AVIF).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const file of list) {
        const stored = await add(file, caption || file.name);
        track("image", `Added image — ${stored.caption}`);
      }
      setCaption("");
    } catch {
      setError("That image could not be processed. Try a different file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="border border-bone/10 bg-ink-900">
      <header className="border-b border-bone/10 px-5 py-4">
        <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
          Quick add from this device
        </h2>
        <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
          Uploaded here means <span className="text-bone">this browser only</span> (IndexedDB) — it
          is the fast path for a picture that is on your phone right now. To reach every visitor,
          drop the file in <code className="text-bone">public/assets/</code> on GitHub and paste its
          path into a slot above.
        </p>
      </header>

      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => void accept(event.target.files)}
          />
          <input
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Caption (optional)"
            className="min-w-0 flex-1 border border-bone/15 bg-ink-950 px-4 py-3 font-body text-sm text-bone placeholder:text-bone-dim focus:border-blood-500/60 focus:outline-none"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="border border-bone/20 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/40 hover:text-bone disabled:opacity-50"
          >
            {busy ? "Processing…" : "Choose files"}
          </button>
          <a
            href={linkTo("/")}
            className="border border-bone/15 px-5 py-3 text-center font-body text-[11px] uppercase tracking-wide2 text-bone-dim transition-colors hover:border-bone/35 hover:text-bone"
          >
            View archive ↗
          </a>
        </div>

        {error ? <p className="font-body text-xs text-blood-300">{error}</p> : null}

        {loading ? (
          <span className="block h-20 animate-pulse bg-bone/5" />
        ) : images.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((image) => (
              <li key={image.id} className="border border-bone/10">
                <img
                  src={image.dataUrl}
                  alt={image.caption}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove “${image.caption}” from this device?`)) {
                      void remove(image.id);
                    }
                  }}
                  className="w-full border-t border-bone/10 px-2 py-1.5 font-body text-[9px] uppercase tracking-wide2 text-bone-dim transition-colors hover:text-blood-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-xs text-bone-dim">Nothing added from this device yet.</p>
        )}
      </div>
    </section>
  );
}
