import type { MediaConfig } from "../data/content";
import { studioDefaults } from "../data/studioDefaults";
import { PAGE_SECTIONS, TUNE_POINTS, type TunePoint } from "../data/tunePoints";
import { normaliseAssetPath } from "./assetPath";

/**
 * ============================================================================
 *  STUDIO — the document behind the dashboard's visual editor
 * ============================================================================
 *  The Images tab edits one thing: the picture in a named slot. This document
 *  edits *anything*: every section, every item inside it, every picture, plus
 *  the page's order, the on/off state of its effects, how fast its motion runs
 *  and where the scroll-driven 3D runs play.
 *
 *  Three ideas, deliberately small:
 *
 *    boxes    one entry per point the owner has touched, keyed by the point's
 *             `data-tune` id. A box is crop, zoom, size, position, rotation,
 *             opacity, blur, radius and stacking — i.e. “make this bigger,
 *             move it, soften it”. Anything left at its default is never
 *             written, so the stored document stays tiny.
 *
 *    stages   a 3D run played at a point on the page: a folder of frames (the
 *             contents of a .zip you extracted into the repository), its
 *             dimensions, which passage of the run plays, and how much scroll
 *             that takes — i.e. “run this animation *here*, this big, this
 *             fast”. It renders through the same sequence renderer the hero
 *             uses, so it is part of the page, not an embed.
 *
 *    motion   the speeds of the built-in choreography: the hero's scrub and
 *             dolly, the pointer parallax, the scroll-wound mark, the pinned
 *             shelf. One place to make the whole site calmer or faster.
 *
 *  This module is pure: types, defaults, normalising and the CSS builder. The
 *  state and its persistence live in `src/lib/siteData.ts`, next to the image
 *  slots, so one Publish button carries the lot to every visitor.
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/*  A box — what an owner can do to any point                                 */
/* -------------------------------------------------------------------------- */

export type TuneBox = {
  /** Off points render nothing at all. */
  on: boolean;
  /** 0.2 … 3 — overall size of the element. */
  scale: number;
  /** 1 … 4 — how far the picture inside its frame is enlarged (crops in). */
  zoom: number;
  /** 0 … 100 — which part of the picture the frame keeps, horizontally. */
  posX: number;
  /** 0 … 100 — and vertically. 50/50 is the centre. */
  posY: number;
  /** −60 … 60 — nudge, as a percentage of the element's own size. */
  moveX: number;
  moveY: number;
  /** −45 … 45 — tilt. */
  rotate: number;
  /** 0.05 … 1 — how strongly it is drawn. */
  opacity: number;
  /** 0 … 24 px — soften the element (pictures: a blurred backdrop). */
  blur: number;
  /** 0 … 64 px — rounded corners; clips what pokes out. */
  radius: number;
  /** 0 = automatic, otherwise the width as a percentage of its container. */
  width: number;
  /** 0 = automatic, otherwise a pixel height. */
  height: number;
  /** 0 = leave it alone, otherwise raise it above its siblings. */
  z: number;
};

export const DEFAULT_BOX: TuneBox = {
  on: true,
  scale: 1,
  zoom: 1,
  posX: 50,
  posY: 50,
  moveX: 0,
  moveY: 0,
  rotate: 0,
  opacity: 1,
  blur: 0,
  radius: 0,
  width: 0,
  height: 0,
  z: 0,
};

/** Every numeric field of a box — everything except the on/off switch. */
export type TuneBoxNumber = Exclude<keyof TuneBox, "on">;

/** Every field, in the order the inspector shows them, with its range. */
export const BOX_FIELDS: Array<{
  key: TuneBoxNumber;
  label: string;
  min: number;
  max: number;
  step: number;
  /** What the control does, in the owner's words. */
  hint: string;
}> = [
  { key: "zoom", label: "Enlarge / crop", min: 1, max: 4, step: 0.01, hint: "Pushes the picture in, cropping it to the frame — 1 is the whole picture." },
  { key: "posX", label: "Crop across", min: 0, max: 100, step: 1, hint: "Which part of the picture survives the crop, left to right." },
  { key: "posY", label: "Crop down", min: 0, max: 100, step: 1, hint: "And top to bottom. 50 is the centre." },
  { key: "scale", label: "Size", min: 0.2, max: 3, step: 0.01, hint: "Scales the whole element in place." },
  { key: "width", label: "Width", min: 0, max: 100, step: 1, hint: "0 leaves the layout alone; anything else is a percentage of its container." },
  { key: "height", label: "Height", min: 0, max: 900, step: 5, hint: "0 keeps the natural height; otherwise a pixel height." },
  { key: "moveX", label: "Move across", min: -60, max: 60, step: 1, hint: "A nudge, as a percentage of the element's own width." },
  { key: "moveY", label: "Move down", min: -60, max: 60, step: 1, hint: "And of its height — negative moves it up." },
  { key: "rotate", label: "Tilt", min: -45, max: 45, step: 1, hint: "Degrees. Small values read as a deliberate skew." },
  { key: "opacity", label: "Opacity", min: 0.05, max: 1, step: 0.01, hint: "How strongly the element is drawn." },
  { key: "blur", label: "Soften", min: 0, max: 24, step: 1, hint: "Pixels of blur — a soft backdrop, or a de-emphasised item." },
  { key: "radius", label: "Rounded", min: 0, max: 64, step: 1, hint: "Corner radius in pixels; the element clips what pokes out." },
  { key: "z", label: "Layer", min: 0, max: 50, step: 1, hint: "Raises the element above its neighbours." },
];

/* -------------------------------------------------------------------------- */
/*  A stage — a 3D run played at a point on the page                          */
/* -------------------------------------------------------------------------- */

export type StageExt = "jpg" | "webp" | "png" | "avif";
export type StageMode = "scroll" | "loop";

export type Stage = {
  id: string;
  label: string;
  /** Which section of the page it plays in. */
  anchor: string;
  /** Before or after that section's own content. */
  placement: "before" | "after";
  /**
   * The run. This is the *folder* you extract the .zip into inside the
   * repository (`public/assets/…`): frames must be zero-padded to three
   * digits and start at 000 — `000.jpg`, `001.jpg`, …
   */
  dir: string;
  count: number;
  ext: StageExt;
  /** Which passage of the run this stage plays, 0 … 1. */
  from: number;
  to: number;
  /** Shown until the first frame decodes — usually the run's own frame 000. */
  poster: string;
  /** How tall the scroll track is, in screens. Bigger = slower. */
  spanVh: number;
  /** 0.25 … 3 — multiplies the speed: 2 plays the run in half the scroll. */
  speed: number;
  /** scroll = scrubbed by the page; loop = plays on its own at `fps`. */
  mode: StageMode;
  fps: number;
  /** Play forward then back, endlessly — the loop that never cuts. */
  pingPong: boolean;
  /** 0.5 … 2 — easing curve. 1 is linear. */
  ease: number;
  /** Frame size: a percentage of the page's width, and a height in px (0 = aspect). */
  widthPct: number;
  heightPx: number;
  /** Aspect used when no pixel height is set. */
  aspect: string;
  radius: number;
  opacity: number;
  /** 0 … 0.9 — a floor under the frame so captions stay legible. */
  shade: number;
  caption: string;
  enabled: boolean;
};

/** The frame runs the project already ships, as ready-made starting points. */
export const STAGE_PRESETS: Array<{ label: string; patch: Partial<Stage> }> = [
  {
    label: "Hero run (scene1 + scene2)",
    patch: {
      label: "Hero run",
      dir: "assets/hero-sequence",
      count: 421,
      ext: "jpg",
      poster: "assets/hero-sequence/000.jpg",
      spanVh: 300,
    },
  },
  {
    label: "Square 3D run (1:1)",
    patch: { label: "Square run", aspect: "1/1", widthPct: 60, spanVh: 200, radius: 10 },
  },
  {
    label: "Cinematic band (21:9)",
    patch: { label: "Cinematic band", aspect: "21/9", widthPct: 100, spanVh: 220, radius: 0 },
  },
  {
    label: "Self-playing loop",
    patch: { label: "Ambient loop", mode: "loop", fps: 24, pingPong: true, spanVh: 120 },
  },
];

export function newStage(id: string, patch: Partial<Stage> = {}): Stage {
  return {
    id,
    label: "New 3D run",
    anchor: "story",
    placement: "after",
    dir: "assets/sequence",
    count: 120,
    ext: "webp",
    from: 0,
    to: 1,
    poster: "",
    spanVh: 160,
    speed: 1,
    mode: "scroll",
    fps: 24,
    pingPong: false,
    ease: 1,
    widthPct: 100,
    heightPx: 0,
    aspect: "16/9",
    radius: 0,
    opacity: 1,
    shade: 0.35,
    caption: "",
    enabled: true,
    ...patch,
  };
}

/* -------------------------------------------------------------------------- */
/*  Motion and effects                                                        */
/* -------------------------------------------------------------------------- */

export type StudioMotion = {
  /** How long the hero's own run lasts, in screens of scroll (e.g. 4.8). */
  heroScrollVh: number;
  /** 0 … 4 — how much the film lags behind the wheel. 0 = frame-perfect. */
  heroScrub: number;
  /** 1 … 1.4 — the dolly: how far the camera pushes into the film. */
  heroDolly: number;
  /** How large the film's stage is, as a percentage of the screen. */
  heroWidthPct: number;
  heroHeightPct: number;
  /** 0 … 3 — pointer/gyro parallax on the hero's planes. */
  heroParallax: number;
  /** 0 … 3 — degrees the scroll-wound mark turns per pixel scrolled. */
  spinDegPerPx: number;
  /** 0 … 3 — the pinned template shelf's scrub. */
  shelfScrub: number;
  /** 0 … 1 — how strongly the shelf's blocks fade as they enter. */
  shelfReveal: number;
  /** 0.6 … 1.4 — global multiplier on how fast scroll-driven runs advance. */
  runSpeed: number;
};

export const DEFAULT_MOTION: StudioMotion = {
  heroScrollVh: 4.8,
  heroScrub: 1.5,
  heroDolly: 1.16,
  heroWidthPct: 100,
  heroHeightPct: 100,
  heroParallax: 1,
  spinDegPerPx: 0.7,
  shelfScrub: 0.8,
  shelfReveal: 1,
  runSpeed: 1,
};

export const MOTION_FIELDS: Array<{
  key: keyof StudioMotion;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  { key: "heroScrollVh", label: "Hero run length", min: 1, max: 12, step: 0.1, hint: "Screens of scroll the opening film takes. Longer = a slower film." },
  { key: "heroScrub", label: "Hero scrub", min: 0, max: 4, step: 0.1, hint: "How far the film lags behind the wheel. 0 is frame-perfect and mechanical." },
  { key: "heroDolly", label: "Hero dolly", min: 1, max: 1.4, step: 0.01, hint: "How far the camera pushes into the film as the run plays." },
  { key: "heroWidthPct", label: "Hero film width", min: 40, max: 100, step: 1, hint: "The film's stage on screen. Under 100 it sits in a letterbox." },
  { key: "heroHeightPct", label: "Hero film height", min: 40, max: 100, step: 1, hint: "And its height, as a percentage of the screen." },
  { key: "heroParallax", label: "Hero parallax", min: 0, max: 3, step: 0.05, hint: "Pointer depth on the planes behind and in front of the film." },
  { key: "spinDegPerPx", label: "Mark spin", min: 0, max: 3, step: 0.05, hint: "Degrees the house mark turns per pixel scrolled." },
  { key: "shelfScrub", label: "Shelf scrub", min: 0, max: 3, step: 0.05, hint: "How much the pinned template shelf lags behind the wheel." },
  { key: "shelfReveal", label: "Shelf reveal", min: 0, max: 1, step: 0.05, hint: "How strongly each block fades in as it slides into frame." },
  { key: "runSpeed", label: "Run speed", min: 0.6, max: 1.4, step: 0.01, hint: "Global trim on every scroll-driven run: 1.2 plays them 20% faster." },
];

export type StudioEffects = {
  /** The site's atmosphere: film grain, vignette, embers and hero haze. */
  grain: boolean;
  vignette: boolean;
  embers: boolean;
  fog: boolean;
  /** The interpolated cursor (desktop only). */
  cursor: boolean;
  /** The title-card counter before the homepage. */
  preloader: boolean;
  /** The scroll-wound mark in the header and the Archive statement. */
  scrollSpin: boolean;
  /** The sound control, and whether interface sound starts switched on. */
  sound: boolean;
  /** Smooth (inertial) scrolling. */
  smoothScroll: boolean;
};

export const DEFAULT_EFFECTS: StudioEffects = {
  grain: true,
  vignette: true,
  embers: true,
  fog: true,
  cursor: true,
  preloader: true,
  scrollSpin: true,
  sound: true,
  smoothScroll: true,
};

export const EFFECT_FIELDS: Array<{ key: keyof StudioEffects; label: string; hint: string }> = [
  { key: "grain", label: "Film grain", hint: "The animated grain over the whole page." },
  { key: "vignette", label: "Vignette", hint: "A soft darkening at the edges of the screen." },
  { key: "embers", label: "Embers", hint: "The drifting embers, heaviest on desktop." },
  { key: "fog", label: "Hero haze", hint: "The volumetric haze over the opening film." },
  { key: "cursor", label: "Custom cursor", hint: "The interpolated ring that follows the pointer on desktop." },
  { key: "preloader", label: "Opening counter", hint: "The title card shown once before the homepage." },
  { key: "scrollSpin", label: "Scroll-wound mark", hint: "The house mark that turns as the page scrolls." },
  { key: "sound", label: "Sound control", hint: "Whether interface sound is offered — and starts on." },
  { key: "smoothScroll", label: "Smooth scrolling", hint: "Inertial scrolling. Off is the plain, native feel." },
];

/* -------------------------------------------------------------------------- */
/*  The document                                                              */
/* -------------------------------------------------------------------------- */

export type StudioDoc = {
  /** Only the points the owner has touched, keyed by `data-tune` id. */
  boxes: Record<string, TuneBox>;
  /** Sections switched off entirely. */
  hidden: string[];
  /** The page's sections, in the order they render. */
  order: string[];
  stages: Stage[];
  motion: StudioMotion;
  effects: StudioEffects;
};

export const MAX_STAGES = 12;

function defaultOrder(): string[] {
  return PAGE_SECTIONS.map((section) => section.id);
}

/** An untouched document: the committed design, before anyone has edited it. */
function emptyStudio(): StudioDoc {
  return {
    boxes: {},
    hidden: [],
    order: defaultOrder(),
    stages: [],
    motion: { ...DEFAULT_MOTION },
    effects: { ...DEFAULT_EFFECTS },
  };
}

/**
 * A fresh copy of the committed defaults — the document in
 * `src/data/studioDefaults.ts` (empty until the owner pastes one in), run
 * through the normaliser so a hand-edited value can never arrive out of range.
 */
export function cloneDefaultStudio(): StudioDoc {
  return normaliseStudio(studioDefaults);
}

/** The committed document. Never mutated — `cloneDefaultStudio` is. */
export const DEFAULT_STUDIO: StudioDoc = cloneDefaultStudio();

/* -------------------------------------------------------------------------- */
/*  Normalising — anything can come back from a network or an old cache       */
/* -------------------------------------------------------------------------- */

function number(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normaliseBox(input: unknown): TuneBox | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  return {
    on: bool(raw.on, DEFAULT_BOX.on),
    scale: number(raw.scale, 0.2, 3, DEFAULT_BOX.scale),
    zoom: number(raw.zoom, 1, 4, DEFAULT_BOX.zoom),
    posX: number(raw.posX, 0, 100, DEFAULT_BOX.posX),
    posY: number(raw.posY, 0, 100, DEFAULT_BOX.posY),
    moveX: number(raw.moveX, -60, 60, DEFAULT_BOX.moveX),
    moveY: number(raw.moveY, -60, 60, DEFAULT_BOX.moveY),
    rotate: number(raw.rotate, -45, 45, DEFAULT_BOX.rotate),
    opacity: number(raw.opacity, 0.05, 1, DEFAULT_BOX.opacity),
    blur: number(raw.blur, 0, 24, DEFAULT_BOX.blur),
    radius: number(raw.radius, 0, 64, DEFAULT_BOX.radius),
    width: number(raw.width, 0, 100, DEFAULT_BOX.width),
    height: number(raw.height, 0, 900, DEFAULT_BOX.height),
    z: number(raw.z, 0, 50, DEFAULT_BOX.z),
  };
}

const EXTS: StageExt[] = ["jpg", "webp", "png", "avif"];

function normaliseStage(input: unknown, index: number): Stage | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const dir = text(raw.dir, "").trim();
  if (!dir) return null;
  // `.jpeg` is the same format as `.jpg`; the site reads one spelling.
  const ext = text(raw.ext, "jpg")
    .replace(/^\./, "")
    .toLowerCase()
    .replace(/^jpeg$/, "jpg");
  const from = number(raw.from, 0, 1, 0);
  const to = number(raw.to, 0, 1, 1);
  const anchor = text(raw.anchor, "story");
  const placement = raw.placement === "before" ? "before" : "after";
  const mode: StageMode = raw.mode === "loop" ? "loop" : "scroll";
  const id = text(raw.id, `stage-${index + 1}`).trim() || `stage-${index + 1}`;
  return {
    id,
    label: text(raw.label, `3D run ${index + 1}`).slice(0, 60),
    anchor: PAGE_SECTIONS.some((section) => section.id === anchor) ? anchor : "story",
    placement,
    // The same normaliser the image slots and the Artwork tab use, so a
    // repo-relative folder, an absolute path and a GitHub blob URL all resolve
    // on both hosts — including GitHub Pages, where assets sit under a sub-path.
    dir: normaliseAssetPath(dir, dir),
    count: Math.round(number(raw.count, 1, 600, 120)),
    ext: (EXTS as string[]).includes(ext) ? (ext as StageExt) : "jpg",
    from: Math.min(from, to),
    to: Math.max(from, to),
    poster: normaliseAssetPath(raw.poster, ""),
    spanVh: number(raw.spanVh, 60, 800, 160),
    speed: number(raw.speed, 0.25, 3, 1),
    mode,
    fps: Math.round(number(raw.fps, 1, 60, 24)),
    pingPong: bool(raw.pingPong, false),
    ease: number(raw.ease, 0.5, 2, 1),
    widthPct: number(raw.widthPct, 20, 100, 100),
    heightPx: Math.round(number(raw.heightPx, 0, 1600, 0)),
    aspect: text(raw.aspect, "16/9"),
    radius: number(raw.radius, 0, 64, 0),
    opacity: number(raw.opacity, 0.1, 1, 1),
    shade: number(raw.shade, 0, 0.9, 0.35),
    caption: text(raw.caption, "").slice(0, 160),
    enabled: bool(raw.enabled, true),
  };
}

export function normaliseStudio(input: unknown): StudioDoc {
  const base = emptyStudio();
  if (!input || typeof input !== "object") return base;
  const raw = input as Record<string, unknown>;

  const boxes: Record<string, TuneBox> = {};
  if (raw.boxes && typeof raw.boxes === "object") {
    Object.entries(raw.boxes as Record<string, unknown>).forEach(([id, value]) => {
      if (!/^[a-z0-9-]{1,60}$/.test(id)) return;
      const box = normaliseBox(value);
      if (box) boxes[id] = box;
    });
  }

  const known = new Set(base.order);
  const hidden = Array.isArray(raw.hidden)
    ? Array.from(new Set(raw.hidden.map((id) => String(id)))).filter((id) => known.has(id))
    : [];

  // The order keeps every known section exactly once: whatever the document
  // says first, then anything the committed page added since.
  const order: string[] = [];
  if (Array.isArray(raw.order)) {
    raw.order.forEach((id) => {
      const value = String(id);
      if (known.has(value) && !order.includes(value)) order.push(value);
    });
  }
  base.order.forEach((id) => {
    if (!order.includes(id)) order.push(id);
  });

  const stages: Stage[] = [];
  if (Array.isArray(raw.stages)) {
    raw.stages.slice(0, MAX_STAGES).forEach((entry, i) => {
      const stage = normaliseStage(entry, i);
      if (stage && !stages.some((existing) => existing.id === stage.id)) stages.push(stage);
    });
  }

  const motionRaw = (raw.motion ?? {}) as Record<string, unknown>;
  const motion = {} as StudioMotion;
  MOTION_FIELDS.forEach((field) => {
    motion[field.key] = number(motionRaw[field.key], field.min, field.max, DEFAULT_MOTION[field.key]);
  });

  const effectsRaw = (raw.effects ?? {}) as Record<string, unknown>;
  const effects = {} as StudioEffects;
  EFFECT_FIELDS.forEach((field) => {
    effects[field.key] = bool(effectsRaw[field.key], DEFAULT_EFFECTS[field.key]);
  });

  return { boxes, hidden, order, stages, motion, effects };
}

/* -------------------------------------------------------------------------- */
/*  Reading                                                                   */
/* -------------------------------------------------------------------------- */

/** The box for a point: what the owner set, or the defaults. */
export function boxOf(doc: StudioDoc, id: string): TuneBox {
  return { ...DEFAULT_BOX, ...(doc.boxes[id] ?? {}) };
}

/** True when a box asks for nothing — such a point is never written to CSS. */
export function isDefaultBox(box: TuneBox): boolean {
  return (Object.keys(DEFAULT_BOX) as Array<keyof TuneBox>).every((key) => box[key] === DEFAULT_BOX[key]);
}

/** True when the owner has changed this point at all. */
export function isTuned(doc: StudioDoc, id: string): boolean {
  return Boolean(doc.boxes[id]) && !isDefaultBox(boxOf(doc, id));
}

export function isSectionHidden(doc: StudioDoc, id: string): boolean {
  return doc.hidden.includes(id);
}

/** The stages that play in one section, in the order they were added. */
export function stagesIn(doc: StudioDoc, sectionId: string, placement: "before" | "after"): Stage[] {
  return doc.stages.filter(
    (stage) => stage.enabled && stage.anchor === sectionId && stage.placement === placement,
  );
}

export function pointOf(id: string): TunePoint | undefined {
  return TUNE_POINTS.find((point) => point.id === id);
}

/* -------------------------------------------------------------------------- */
/*  The CSS the site actually renders                                         */
/* -------------------------------------------------------------------------- */

function boxDeclarations(box: TuneBox, allowTransform: boolean): string[] {
  if (!box.on) return ["display:none"];
  const out: string[] = [];
  if (box.opacity !== 1) out.push(`opacity:${box.opacity}`);
  if (box.blur > 0) out.push(`filter:blur(${box.blur}px)`);
  if (box.radius > 0) out.push(`border-radius:${box.radius}px`, "overflow:hidden");
  if (box.width > 0) out.push(`width:${box.width}%`, "max-width:none");
  if (box.height > 0) out.push(`height:${box.height}px`);
  if (box.z > 0) out.push(`z-index:${box.z}`);

  if (allowTransform) {
    const parts: string[] = [];
    if (box.moveX !== 0 || box.moveY !== 0) parts.push(`translate(${box.moveX}%, ${box.moveY}%)`);
    if (box.rotate !== 0) parts.push(`rotate(${box.rotate}deg)`);
    if (box.scale !== 1) parts.push(`scale(${box.scale})`);
    if (parts.length) out.push(`transform:${parts.join(" ")}`, "transform-origin:center");
  }
  return out;
}

/**
 * The rules for one point.
 *
 * A point that hosts pinned or sticky machinery refuses transforms: a
 * `transform` on an ancestor turns `position: fixed` — which is how the pinned
 * sections are held — into a lie, and the page would tear. Everything else
 * (size, crop, opacity, blur, radius) is safe there.
 */
function rulesFor(id: string, box: TuneBox, allowTransform: boolean): string[] {
  const target = `[data-tune="${id}"]`;
  const rules: string[] = [];
  const declarations = boxDeclarations(box, allowTransform);
  if (declarations.length) rules.push(`${target}{${declarations.join(";")}}`);

  if (box.on && (box.zoom !== 1 || box.posX !== 50 || box.posY !== 50)) {
    const media: string[] = [`object-position:${box.posX}% ${box.posY}%`];
    if (box.zoom !== 1) media.push(`transform:scale(${box.zoom})`, "transform-origin:center");
    rules.push(`${target} img,${target} canvas,${target} video{${media.join(";")}}`);
  }
  return rules;
}

/** The whole stylesheet the studio document describes. */
export function studioCss(doc: StudioDoc): string {
  const rules: string[] = [];
  Object.keys(doc.boxes).forEach((id) => {
    const box = boxOf(doc, id);
    if (isDefaultBox(box)) return;
    const point = pointOf(id);
    rules.push(...rulesFor(id, box, point ? point.transform : true));
  });
  /*
   * Points whose knob is their slot's own fields (every picture in the Images
   * tab) are written by `SlotMedia`, not here — but a section can still ask for
   * its pictures to be zoomed or cropped, so those subtrees are handled above
   * by the section's own box.
   */
  return rules.join("\n");
}

/* -------------------------------------------------------------------------- */
/*  Stage playback maths                                                      */
/* -------------------------------------------------------------------------- */

/**
 * How tall the stage's scroll track is, in screens of scroll. `runSpeed` is the
 * document-wide trim from the Motion tab, so one number can make every run on
 * the page faster or calmer without touching each stage.
 */
export function stageDistanceVh(stage: Stage, runSpeed = 1): number {
  const global = Math.max(0.25, runSpeed);
  if (stage.mode === "loop") return (Math.max(40, stage.spanVh * 0.5) * 0.4) / global;
  return Math.max(20, stage.spanVh / Math.max(0.25, stage.speed) / global);
}

/**
 * Turn a 0 → 1 scroll position into the 0 → 1 position inside the run the
 * viewer should be looking at: the stage's own window, eased, and reversed on
 * the way back when the stage ping-pongs.
 */
export function stagePosition(stage: Stage, progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  const eased = stage.ease === 1 ? p : Math.pow(p, stage.ease);
  const t = stage.pingPong ? (eased <= 0.5 ? eased * 2 : (1 - eased) * 2) : eased;
  const from = Math.min(stage.from, stage.to);
  const to = Math.max(stage.from, stage.to);
  return Math.max(0, Math.min(1, from + (to - from) * t));
}

/** The stage as a media config, so the site's own sequence renderer draws it. */
export function stageMedia(stage: Stage): MediaConfig {
  return {
    mode: "sequence",
    videoSrc: "",
    frameDir: stage.dir,
    frameCount: stage.count,
    frameExt: stage.ext,
    poster: stage.poster,
    scrollLength: "",
    sourceNote: "Studio stage",
  };
}

/** `assets/sequence/000.webp` — the first frame of a stage's run. */
export function stageFirstFrame(stage: Stage): string {
  if (!stage.dir) return "";
  return `${stage.dir.replace(/\/+$/, "")}/${"000"}.${stage.ext}`;
}
