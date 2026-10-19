import { useRef, useState } from "react";
import { PAGE_SECTIONS } from "../../data/tunePoints";
import { MAX_STAGES, STAGE_PRESETS, newStage, type Stage, type StageExt } from "../../lib/studio";

/**
 * ============================================================================
 *  STAGES — the 3D runs, chosen by point, size and speed
 * ============================================================================
 *  A stage is one numbered run of frames played at a point on the page: the
 *  folder the .zip was extracted into, how many frames it holds, which passage
 *  of it plays, and how much scrolling that takes.
 *
 *  The route the owner asked for: export the animation as stills, put them in
 *  the repository (drop the folder in `public/assets/…` on GitHub, or unzip it
 *  wherever the repo already holds assets), then paste the folder path, the
 *  frame count and the extension here. A .zip is never read at runtime — no
 *  browser can play one, and the site must not depend on a file it cannot
 *  open — so the folder is what the page plays.
 *
 *  Every stage renders through the site's own sequence renderer
 *  (`StageBand` → `ScrollMedia`), which means it is part of the page: it
 *  inherits the palette, sits in normal document flow, and streams its frames
 *  the way the hero's film does.
 * ============================================================================
 */

const field =
  "w-full border border-bone/15 bg-ink-950 px-3 py-2 font-mono text-[11px] text-bone placeholder:text-bone-dim focus:border-blood-500/70 focus:outline-none";
const label = "mb-1.5 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim";
const chip =
  "border border-bone/15 px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone";

const ASPECTS = ["21/9", "16/9", "3/2", "4/3", "1/1", "4/5", "3/4", "9/16"];
const EXTS: StageExt[] = ["jpg", "webp", "png", "avif"];

export default function StageEditor({
  stages,
  onChange,
  onJump,
}: {
  stages: Stage[];
  onChange: (stages: Stage[]) => void;
  /** Walk the live preview to the section a stage is anchored to. */
  onJump: (sectionId: string) => void;
}) {
  const counter = useRef(stages.length);

  const patch = (id: string, values: Partial<Stage>) =>
    onChange(stages.map((stage) => (stage.id === id ? { ...stage, ...values } : stage)));

  const add = (preset?: Partial<Stage>) => {
    if (stages.length >= MAX_STAGES) return;
    counter.current += 1;
    const id = `stage-${Date.now().toString(36)}-${counter.current}`;
    onChange([...stages, newStage(id, { label: `3D run ${stages.length + 1}`, ...preset })]);
  };

  const duplicate = (stage: Stage) => {
    if (stages.length >= MAX_STAGES) return;
    counter.current += 1;
    onChange([
      ...stages,
      { ...stage, id: `stage-${Date.now().toString(36)}-${counter.current}`, label: `${stage.label} (copy)` },
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => add()}
          className="border border-blood-600/70 bg-blood-600/10 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-500 hover:bg-blood-600/20"
        >
          Add a 3D run
        </button>
        {STAGE_PRESETS.map((preset) => (
          <button key={preset.label} type="button" onClick={() => add(preset.patch)} className={chip}>
            {preset.label}
          </button>
        ))}
      </div>

      {stages.length === 0 ? (
        <p className="border border-bone/10 bg-ink-900 px-5 py-6 font-body text-xs leading-relaxed text-bone-muted">
          No runs yet. Extract your animation's .zip into the repository — frames zero-padded to
          three digits, starting at <code className="text-bone">000</code>, e.g.{" "}
          <code className="text-bone">public/assets/sequence/000.jpg</code> — then add a run here,
          point it at that folder, and choose where on the page it plays. It renders inside the page
          itself, exactly like the hero's opening film.
        </p>
      ) : null}

      {stages.map((stage, index) => (
        <section key={stage.id} className="border border-bone/10 bg-ink-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bone/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="font-mono text-[11px] text-blood-500/80">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="truncate font-body text-[11px] uppercase tracking-wide2 text-bone">
                {stage.label || "Untitled run"}
              </span>
              <span className="hidden font-body text-[10px] uppercase tracking-wide2 text-bone-dim sm:inline">
                {stage.enabled ? "playing" : "off"} · {stage.count} frames ·{" "}
                {stage.mode === "loop" ? `${stage.fps} fps` : `${stage.spanVh}/${stage.speed} screens`}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => onJump(stage.anchor)} className={chip}>
                Show me
              </button>
              <button
                type="button"
                aria-pressed={stage.enabled}
                onClick={() => patch(stage.id, { enabled: !stage.enabled })}
                className={`border px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                  stage.enabled ? "border-emerald-400/40 text-emerald-200/90" : "border-bone/20 text-bone-dim"
                }`}
              >
                {stage.enabled ? "On" : "Off"}
              </button>
              <button type="button" onClick={() => duplicate(stage)} className={chip}>
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete “${stage.label || "this run"}”?`)) {
                    onChange(stages.filter((entry) => entry.id !== stage.id));
                  }
                }}
                className="border border-blood-800/60 px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-blood-400/80 transition-colors hover:border-blood-600 hover:text-blood-300"
              >
                Delete
              </button>
            </div>
          </header>

          <div className="flex flex-col gap-6 p-4">
            {/* ------------------------------------------------ where it plays */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <TextField
                  id={`stage-label-${stage.id}`}
                  label="Name (for you)"
                  value={stage.label}
                  placeholder="Hero run, second pass"
                  onCommit={(value) => patch(stage.id, { label: value })}
                />
              </div>
              <div>
                <label className={label} htmlFor={`stage-anchor-${stage.id}`}>
                  Plays in
                </label>
                <select
                  id={`stage-anchor-${stage.id}`}
                  className={field}
                  value={stage.anchor}
                  onChange={(event) => patch(stage.id, { anchor: event.target.value })}
                >
                  {PAGE_SECTIONS.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor={`stage-placement-${stage.id}`}>
                  Position
                </label>
                <select
                  id={`stage-placement-${stage.id}`}
                  className={field}
                  value={stage.placement}
                  onChange={(event) =>
                    patch(stage.id, { placement: event.target.value === "before" ? "before" : "after" })
                  }
                >
                  <option value="after">After that section</option>
                  <option value="before">Before that section</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor={`stage-mode-${stage.id}`}>
                  Driven by
                </label>
                <select
                  id={`stage-mode-${stage.id}`}
                  className={field}
                  value={stage.mode}
                  onChange={(event) =>
                    patch(stage.id, { mode: event.target.value === "loop" ? "loop" : "scroll" })
                  }
                >
                  <option value="scroll">Scroll — scrubbed by the page</option>
                  <option value="loop">Itself — plays at a frame rate</option>
                </select>
              </div>
              <div>
                <span className={label}>Toggles</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={stage.pingPong}
                    onClick={() => patch(stage.id, { pingPong: !stage.pingPong })}
                    className={`border px-3 py-1.5 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                      stage.pingPong ? "border-blood-500/70 text-bone" : "border-bone/20 text-bone-dim"
                    }`}
                  >
                    Ping-pong
                  </button>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------- the run */}
            <div className="border border-bone/10 p-3">
              <span className={label}>The run — the folder your .zip was extracted into</span>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <TextField
                    id={`stage-dir-${stage.id}`}
                    label="Frame folder"
                    value={stage.dir}
                    placeholder="assets/sequence"
                    onCommit={(value) => patch(stage.id, { dir: value })}
                  />
                </div>
                <NumberField
                  id={`stage-count-${stage.id}`}
                  label="Frames"
                  value={stage.count}
                  min={1}
                  max={600}
                  step={1}
                  onCommit={(value) => patch(stage.id, { count: Math.round(value) })}
                />
                <div>
                  <label className={label} htmlFor={`stage-ext-${stage.id}`}>
                    Extension
                  </label>
                  <select
                    id={`stage-ext-${stage.id}`}
                    className={field}
                    value={stage.ext}
                    onChange={(event) => patch(stage.id, { ext: event.target.value as StageExt })}
                  >
                    {EXTS.map((ext) => (
                      <option key={ext} value={ext}>
                        {ext}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <TextField
                    id={`stage-poster-${stage.id}`}
                    label="Poster (shown until the first frame lands — leave empty to use frame 000)"
                    value={stage.poster}
                    placeholder="assets/sequence/000.jpg"
                    onCommit={(value) => patch(stage.id, { poster: value })}
                  />
                  <p className="mt-2 font-body text-[11px] leading-relaxed text-bone-dim">
                    Frames are read as{" "}
                    <code className="text-bone-muted">
                      {stage.dir || "assets/sequence"}/000.{stage.ext}
                    </code>{" "}
                    → {String(Math.max(0, stage.count - 1)).padStart(3, "0")}.
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------ the window */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField
                id={`stage-from-${stage.id}`}
                label="Plays from (0–1)"
                value={stage.from}
                min={0}
                max={1}
                step={0.01}
                onCommit={(value) => patch(stage.id, { from: Math.min(value, stage.to) })}
              />
              <NumberField
                id={`stage-to-${stage.id}`}
                label="Plays to (0–1)"
                value={stage.to}
                min={0}
                max={1}
                step={0.01}
                onCommit={(value) => patch(stage.id, { to: Math.max(value, stage.from) })}
              />
              <NumberField
                id={`stage-span-${stage.id}`}
                label="Scroll it takes (screens)"
                value={stage.spanVh}
                min={60}
                max={800}
                step={10}
                onCommit={(value) => patch(stage.id, { spanVh: value })}
              />
              <NumberField
                id={`stage-speed-${stage.id}`}
                label="Speed (×)"
                value={stage.speed}
                min={0.25}
                max={3}
                step={0.05}
                onCommit={(value) => patch(stage.id, { speed: value })}
              />
              <NumberField
                id={`stage-ease-${stage.id}`}
                label="Ease (1 = even)"
                value={stage.ease}
                min={0.5}
                max={2}
                step={0.05}
                onCommit={(value) => patch(stage.id, { ease: value })}
              />
              {stage.mode === "loop" ? (
                <NumberField
                  id={`stage-fps-${stage.id}`}
                  label="Frames a second"
                  value={stage.fps}
                  min={1}
                  max={60}
                  step={1}
                  onCommit={(value) => patch(stage.id, { fps: Math.round(value) })}
                />
              ) : null}
            </div>

            {/* ---------------------------------------------------- the frame */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField
                id={`stage-width-${stage.id}`}
                label="Width (% of the page)"
                value={stage.widthPct}
                min={20}
                max={100}
                step={1}
                onCommit={(value) => patch(stage.id, { widthPct: value })}
              />
              <NumberField
                id={`stage-height-${stage.id}`}
                label="Height (px, 0 = the aspect below)"
                value={stage.heightPx}
                min={0}
                max={1600}
                step={10}
                onCommit={(value) => patch(stage.id, { heightPx: Math.round(value) })}
              />
              <div>
                <label className={label} htmlFor={`stage-aspect-${stage.id}`}>
                  Shape
                </label>
                <select
                  id={`stage-aspect-${stage.id}`}
                  className={field}
                  value={stage.aspect}
                  onChange={(event) => patch(stage.id, { aspect: event.target.value })}
                  disabled={stage.heightPx > 0}
                >
                  {ASPECTS.map((aspect) => (
                    <option key={aspect} value={aspect}>
                      {aspect}
                    </option>
                  ))}
                </select>
              </div>
              <NumberField
                id={`stage-radius-${stage.id}`}
                label="Rounded corners (px)"
                value={stage.radius}
                min={0}
                max={64}
                step={1}
                onCommit={(value) => patch(stage.id, { radius: value })}
              />
              <NumberField
                id={`stage-opacity-${stage.id}`}
                label="Opacity"
                value={stage.opacity}
                min={0.1}
                max={1}
                step={0.01}
                onCommit={(value) => patch(stage.id, { opacity: value })}
              />
              <NumberField
                id={`stage-shade-${stage.id}`}
                label="Floor under the frame"
                value={stage.shade}
                min={0}
                max={0.9}
                step={0.05}
                onCommit={(value) => patch(stage.id, { shade: value })}
              />
            </div>

            <TextField
              id={`stage-caption-${stage.id}`}
              label="Caption over the run (optional)"
              value={stage.caption}
              placeholder="Ten seconds of the render, scrubbed by your scroll."
              onCommit={(value) => patch(stage.id, { caption: value })}
            />
          </div>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fields                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Text that commits on blur or Enter. A path is typed character by character,
 * and committing each keystroke would repaint the whole page — and, with a
 * shared backend, fire a request — for every letter of a filename.
 */
function TextField({
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
  const last = useRef(value);
  if (last.current !== value) {
    last.current = value;
    if (draft !== value) setDraft(value);
  }

  return (
    <div>
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
