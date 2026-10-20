import { useMemo, useSyncExternalStore } from "react";
import {
  assetDefaults,
  mediaDefaults,
  mobileMediaDefaults,
  projects as defaultProjects,
  type AssetKey,
  type MediaConfig,
  type Project,
} from "../data/content";
import {
  ANIMATION_ORDER,
  IMAGE_SECTIONS,
  SLOTS_PER_SECTION,
  defaultSlotMap,
  imageSlotDefaults,
  slotId,
  type ImageSectionId,
  type ImageSlot,
  type SlotAnimation,
  type SlotFilm,
} from "../data/imageSlots";
import { cloneDefaultStudio, normaliseStudio, type StudioDoc } from "./studio";
import { normaliseAssetPath } from "./assetPath";
import { authHeaders } from "./apiAuth";
import { dataApiUrl, getVisitorId } from "./telemetry";

/**
 * ============================================================================
 *  SITE DATA — admin-editable content that reaches every visitor
 * ============================================================================
 *  Three things the owner edits from the dashboard:
 *
 *    • assets   — the public path of each piece of artwork (upload it to
 *                 GitHub, paste the path here)
 *    • media    — the cinematic scroll media: procedural scene, video, or
 *                 scroll-scrubbed image sequence (see docs/ASSET_WORKFLOW.md)
 *    • projects — the project cards shown on the homepage
 *    • slots    — every picture on the page, section by section: the still or
 *                 scroll film it draws, plus its animation, opacity, blur,
 *                 background colour, width, height and crop (src/data/imageSlots.ts)
 *    • studio   — the visual editor's document: a box per point the owner has
 *                 touched (crop, size, position, opacity), the page order and
 *                 which sections are switched off, the 3D runs ("stages") and
 *                 their dimensions and speed, the motion speeds and the effect
 *                 switches (src/lib/studio.ts)
 *
 *  Persistence is layered, and the site never blocks on any of it:
 *
 *    1. built-in defaults (src/data/content.ts) — always present, always valid
 *    2. this browser (localStorage)             — instant, offline-friendly
 *    3. the shared backend (/api/analytics)     — reaches every visitor
 *
 *  Reads are public (they are the site's own content). Writes require a valid
 *  Clerk session from an allowed admin address — the backend rejects them
 *  otherwise, so this is not frontend-only security.
 * ============================================================================
 */

export type SiteConfig = {
  assets: Record<AssetKey, string>;
  /** The desktop hero's film. */
  media: MediaConfig;
  /** The phone hero's own film — see `mobileMediaDefaults` in content.ts. */
  mobileMedia: MediaConfig;
};

export type SiteData = SiteConfig & {
  projects: Project[];
  slots: ImageSlot[];
  studio: StudioDoc;
};

export const DEFAULT_SITE_DATA: SiteData = {
  assets: { ...assetDefaults },
  media: { ...mediaDefaults },
  mobileMedia: { ...mobileMediaDefaults },
  projects: defaultProjects.map((p) => ({ ...p })),
  slots: imageSlotDefaults.map((s) => ({ ...s, film: s.film ? { ...s.film } : null })),
  studio: cloneDefaultStudio(),
};

/*
 * v2: the shipped default media became the scroll sequence, so a document
 * cached under the old key (whose `mode` still said "scene") would silently
 * pin the hero to the procedural scene.
 *
 * v3: the sequence changed from the 300-frame `Images.zip` render to the
 * 421-frame scene1 + scene2 merge. A v2 document still carries
 * `frameCount: 300` for `hero-sequence`, which would hide the last 121 frames
 * of the run for every returning visitor — so the key moves forward again and
 * the new default reaches them. Dashboard edits made from here on persist
 * normally.
 *
 * v4: image slots arrived — every picture on the page became a numbered slot
 * inside a section, editable from #/admin → Images. A v3 document has no
 * `slots` at all, and normalising it would fall back to the committed
 * defaults anyway, but the key moves so a stale cached document can never
 * shadow the new section-wise editor.
 *
 * v5: the Archive's tiles went back to empty. A v4 document — written by the
 * build that filled all six tiles with a scroll film of a render that has since
 * been deleted — would keep pointing those tiles at frames that no longer
 * exist, so every returning visitor would see six broken frames. The key moves
 * so the new defaults (three stills, six empty slots) reach them.
 *
 * v6: a new band arrived — the kinetic statement, directly after the approach
 * copy. A v5 document has no `statement` in its order, and the normaliser would
 * append it at the very end of the page instead, so the one section written to
 * be read right after the hero would sit above the footer for every returning
 * visitor. The key moves so the committed order (and the band's place in it)
 * reaches them. Dashboard edits made from here on persist normally.
 *
 * v7: the phone hero — a separate portrait film plus its own motion numbers.
 * A v6 document has no `mobileMedia` and no `studio.mobile`, so a returning
 * visitor's cached copy would keep the phone on the desktop run. The key moves
 * so the committed phone film reaches them.
 */
const STORAGE_KEY = "wz.site.v7";
const CHANGE_EVENT = "wz:site-changed";

type Listener = () => void;

let data: SiteData = DEFAULT_SITE_DATA;
let loaded = false;
let remoteApplied = false;
const listeners = new Set<Listener>();

/* -------------------------------------------------------------------------- */
/*  Normalising — anything can come back from the network                     */
/* -------------------------------------------------------------------------- */

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normaliseAssets(input: unknown, base: Record<AssetKey, string>) {
  const source = (input ?? {}) as Record<string, unknown>;
  const next = { ...base };
  (Object.keys(base) as AssetKey[]).forEach((key) => {
    next[key] = normaliseAssetPath(source[key], base[key]);
  });
  return next;
}

export function normaliseMedia(input: unknown, base: MediaConfig): MediaConfig {
  const source = (input ?? {}) as Record<string, unknown>;
  const rawMode = asString(source.mode, base.mode);
  const mode: MediaConfig["mode"] =
    rawMode === "video" || rawMode === "sequence" ? rawMode : "scene";
  const rawExt = asString(source.frameExt, base.frameExt).replace(/^\./, "");
  const frameExt: MediaConfig["frameExt"] = (
    ["webp", "avif", "jpg", "png"] as const
  ).includes(rawExt as MediaConfig["frameExt"])
    ? (rawExt as MediaConfig["frameExt"])
    : base.frameExt;

  const count = Number(source.frameCount);

  /*
   * A missing field falls back to the committed value; an explicit empty
   * string clears it. The distinction matters: an old shared document (or a
   * partial local document) has no `media.frameDir` at all, and treating that
   * as "cleared" left the hero with mode "sequence" and no folder — it fell
   * through to the heavy procedural scene instead of the shipped film. The
   * phone's `mobileMedia` would hit exactly that on every deployment whose
   * stored config predates it.
   */
  const text = (value: unknown, fallback: string): string =>
    typeof value === "string" ? value : fallback;

  return {
    mode,
    videoSrc: source.videoSrc == null ? base.videoSrc : normaliseAssetPath(source.videoSrc, ""),
    frameDir: source.frameDir == null ? base.frameDir : normaliseAssetPath(source.frameDir, ""),
    frameCount: Number.isFinite(count) ? Math.max(0, Math.min(1200, Math.round(count))) : base.frameCount,
    frameExt,
    poster: source.poster == null ? base.poster : normaliseAssetPath(source.poster, ""),
    scrollLength: text(source.scrollLength, base.scrollLength).trim() || base.scrollLength,
    sourceNote: text(source.sourceNote, base.sourceNote),
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

const FRAME_EXTS = ["jpg", "jpeg", "webp", "png", "avif"] as const;

/** A frame run, or null when the slot has no film. */
function normaliseFilm(input: unknown, fallback: SlotFilm | null): SlotFilm | null {
  if (input === null) return null;
  if (!input || typeof input !== "object") return fallback;
  const source = input as Record<string, unknown>;
  const dir = asString(source.dir, "").trim();
  if (!dir) return null;
  const rawExt = asString(source.ext, fallback?.ext ?? "jpg").replace(/^\./, "").toLowerCase();
  const ext = (FRAME_EXTS as readonly string[]).includes(rawExt)
    ? (rawExt as SlotFilm["ext"])
    : (fallback?.ext ?? "jpg");
  return {
    dir: normaliseAssetPath(dir, fallback?.dir ?? dir),
    count: Math.round(clampNumber(source.count, 1, 600, fallback?.count ?? 1)),
    ext,
  };
}

/**
 * Image slots. Anything can come back from the network or an old cache, so
 * every field is re-derived here, slot by slot, and the result is always the
 * canonical shape: nine slots per section, in order.
 */
function normaliseSlots(input: unknown, base: ImageSlot[]): ImageSlot[] {
  const byId = new Map<string, ImageSlot>();
  const fallbacks = defaultSlotMap();
  base.forEach((entry) => byId.set(entry.id, entry));
  fallbacks.forEach((entry, id) => {
    if (!byId.has(id)) byId.set(id, entry);
  });

  if (Array.isArray(input)) {
    input.forEach((raw) => {
      if (!raw || typeof raw !== "object") return;
      const entry = raw as Record<string, unknown>;
      const section = asString(entry.section, "") as ImageSectionId;
      if (!IMAGE_SECTIONS.some((candidate) => candidate.id === section)) return;
      const index = Math.round(clampNumber(entry.index, 1, SLOTS_PER_SECTION, 0));
      if (!index) return;
      const id = slotId(section, index);
      const fallback = byId.get(id);
      if (!fallback) return;

      const animation = asString(entry.animation, fallback.animation) as SlotAnimation;
      const from = clampNumber(entry.filmFrom, 0, 1, fallback.filmFrom);
      const to = clampNumber(entry.filmTo, 0, 1, fallback.filmTo);
      const film = normaliseFilm(entry.film === undefined ? fallback.film : entry.film, fallback.film);

      byId.set(id, {
        id,
        section,
        index,
        src: normaliseAssetPath(entry.src, ""),
        film,
        caption: asString(entry.caption, fallback.caption),
        alt: asString(entry.alt, fallback.alt),
        animation: ANIMATION_ORDER.includes(animation) ? animation : fallback.animation,
        opacity: clampNumber(entry.opacity, 0.1, 1, fallback.opacity),
        blur: clampNumber(entry.blur, 0, 24, fallback.blur),
        background: asString(entry.background, fallback.background).trim(),
        width: clampNumber(entry.width, 20, 100, fallback.width),
        height: Math.round(clampNumber(entry.height, 0, 1600, fallback.height)),
        // The crop trio: how far the picture is enlarged inside its frame and
        // which part of it survives the crop.
        zoom: clampNumber(entry.zoom, 1, 4, fallback.zoom),
        posX: clampNumber(entry.posX, 0, 100, fallback.posX),
        posY: clampNumber(entry.posY, 0, 100, fallback.posY),
        radius: clampNumber(entry.radius, 0, 64, fallback.radius),
        // A reversed window would make the run play backwards mid-tile.
        filmFrom: Math.min(from, to),
        filmTo: Math.max(from, to),
        enabled: entry.enabled === undefined ? fallback.enabled : Boolean(entry.enabled),
      });
    });
  }

  return IMAGE_SECTIONS.flatMap((section) =>
    Array.from({ length: SLOTS_PER_SECTION }, (_, i) => byId.get(slotId(section.id, i + 1))).filter(
      (entry): entry is ImageSlot => Boolean(entry),
    ),
  );
}

function normaliseProjects(input: unknown, base: Project[]): Project[] {
  if (!Array.isArray(input)) return base;
  const list = input
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object")
    .map((p, i) => {
      const id = asString(p.id, `project-${i + 1}`);
      // Older stored documents predate `pages` / `showInArchive`; falling back
      // to the committed default (not a blanket `true`) keeps the E-books
      // Store out of The Archive for visitors with an old copy cached.
      const fallback = base.find((b) => b.id === id);
      return {
        id,
        index: asString(p.index, String(i + 1).padStart(2, "0")),
        title: asString(p.title, `Project ${i + 1}`),
        accent: asString(p.accent, ""),
        category: asString(p.category, ""),
        description: asString(p.description, ""),
        image: normaliseAssetPath(p.image, ""),
        highlights: Array.isArray(p.highlights) ? p.highlights.map((h) => String(h)) : [],
        stack: Array.isArray(p.stack) ? p.stack.map((s) => String(s)) : [],
        href: asString(p.href, "").trim() || undefined,
        live: Boolean(p.live),
        parent: asString(p.parent, "").trim() || undefined,
        pages: Array.isArray(p.pages)
          ? p.pages
              .filter((pg): pg is Record<string, unknown> => Boolean(pg) && typeof pg === "object")
              .map((pg) => ({
                label: asString(pg.label, "").trim(),
                href: asString(pg.href, "").trim(),
              }))
              .filter((pg) => pg.label && pg.href)
          : fallback?.pages,
        showInArchive:
          p.showInArchive === undefined
            ? (fallback ? fallback.showInArchive : true)
            : Boolean(p.showInArchive),
      };
    })
    .filter((p) => p.title.trim().length > 0);
  return list.length ? list : base;
}

/* -------------------------------------------------------------------------- */
/*  Local persistence                                                         */
/* -------------------------------------------------------------------------- */

function safeParse(raw: string | null): Partial<SiteData> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Partial<SiteData>) : null;
  } catch {
    return null;
  }
}

function applyDocument(doc: Partial<SiteData> | null): void {
  if (!doc) return;
  data = {
    assets: normaliseAssets(doc.assets, DEFAULT_SITE_DATA.assets),
    media: normaliseMedia(doc.media, DEFAULT_SITE_DATA.media),
    mobileMedia: normaliseMedia(doc.mobileMedia, DEFAULT_SITE_DATA.mobileMedia),
    projects: normaliseProjects(doc.projects, DEFAULT_SITE_DATA.projects),
    slots: normaliseSlots(doc.slots, DEFAULT_SITE_DATA.slots),
    studio: normaliseStudio(doc.studio),
  };
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  applyDocument(safeParse(window.localStorage.getItem(STORAGE_KEY)));
  void pullRemote();
  ensureChannel();
  window.addEventListener(CHANGE_EVENT, () => notify());
}

/* -------------------------------------------------------------------------- */
/*  Cross-context sync                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The dashboard's Studio tab shows the site in a frame, and the site itself is
 * often open in another tab. Those are separate JavaScript contexts reading the
 * same document, so a write in one has to reach the others or the frame would
 * sit there showing the version before the last slider moved. One
 * BroadcastChannel carries the document across; the receiving side applies it
 * *without* committing, so two contexts can never bounce it back and forth.
 *
 * Guarded, because the channel is a nicety: where it does not exist the site
 * still works, it simply does not follow another tab.
 */
const CHANNEL_NAME = "wz:site-data";
let channel: BroadcastChannel | null = null;

function ensureChannel(): void {
  if (channel || typeof BroadcastChannel === "undefined") return;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
    return;
  }
  channel.onmessage = (event: MessageEvent) => {
    applyDocument(event.data as Partial<SiteData>);
    notify();
  };
}

function broadcast(): void {
  if (!channel) return;
  try {
    channel.postMessage({
      assets: data.assets,
      media: data.media,
      mobileMedia: data.mobileMedia,
      projects: data.projects,
      slots: data.slots,
      studio: data.studio,
    });
  } catch {
    /* The document was not cloneable — the tab simply does not follow. */
  }
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode — best effort */
  }
}

function commit(next: SiteData, { push = true }: { push?: boolean } = {}): void {
  data = next;
  persist();
  notify();
  broadcast();
  if (push) void pushRemote();
}

/* -------------------------------------------------------------------------- */
/*  Shared backend                                                            */
/* -------------------------------------------------------------------------- */

export type RemotePublicState =
  | { status: "disabled" }
  | { status: "loading" }
  | { status: "ready"; data: SiteData }
  | { status: "error" };

let publicState: RemotePublicState = dataApiUrl ? { status: "loading" } : { status: "disabled" };

/** Pull the shared document (public fields only). Safe to call repeatedly. */
export async function pullRemote(): Promise<void> {
  if (!dataApiUrl) {
    publicState = { status: "disabled" };
    return;
  }
  try {
    const res = await fetch(dataApiUrl, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    const raw = (await res.json()) as {
      config?: Partial<SiteConfig> & { slots?: unknown; studio?: unknown };
      projects?: unknown;
    };
    const next: SiteData = {
      assets: normaliseAssets(raw.config?.assets, data.assets),
      media: normaliseMedia(raw.config?.media, data.media),
      mobileMedia: normaliseMedia(raw.config?.mobileMedia, data.mobileMedia),
      projects: normaliseProjects(raw.projects, data.projects),
      slots: normaliseSlots(raw.config?.slots, data.slots),
      studio: normaliseStudio(raw.config?.studio ?? data.studio),
    };
    data = next;
    remoteApplied = true;
    persist();
    notify();
    publicState = { status: "ready", data: next };
  } catch {
    publicState = { status: "error" };
  }
}

/** Push the shared document. The backend returns 403 for non-admins. */
async function pushRemote(): Promise<boolean> {
  if (!dataApiUrl) return false;
  try {
    const res = await fetch(dataApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        visitor: getVisitorId(),
        config: {
          assets: data.assets,
          media: data.media,
          mobileMedia: data.mobileMedia,
          slots: data.slots,
          studio: data.studio,
        },
        projects: data.projects,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Publish the current document to the shared backend, reporting the result so
 * the dashboard can tell "saved here" apart from "live for every visitor".
 */
export async function publishSiteData(): Promise<{ ok: boolean; detail: string }> {
  ensureLoaded();
  if (!dataApiUrl) {
    return { ok: false, detail: "No shared backend is configured for this build." };
  }
  const ok = await pushRemote();
  return ok
    ? { ok: true, detail: "Published — every visitor now gets these values." }
    : {
        ok: false,
        detail:
          "The backend refused the change. Check that you are signed in as an allowed admin and that ADMIN_USER_IDS / ADMIN_EMAILS are set on the server.",
      };
}

export const isRemoteSiteDataEnabled = dataApiUrl.length > 0;
export const hasRemoteSiteData = (): boolean => remoteApplied;
export const getRemotePublicState = (): RemotePublicState => publicState;

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export function getSiteData(): SiteData {
  ensureLoaded();
  return data;
}

export function useSiteData(): SiteData {
  return useSyncExternalStore(subscribe, getSiteData, () => DEFAULT_SITE_DATA);
}

function subscribe(fn: Listener): () => void {
  ensureLoaded();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Update asset paths and/or the scroll-media config. */
export function updateConfig(patch: Partial<SiteConfig>): void {
  ensureLoaded();
  commit({
    ...data,
    assets: normaliseAssets({ ...data.assets, ...patch.assets }, DEFAULT_SITE_DATA.assets),
    media: normaliseMedia({ ...data.media, ...patch.media }, data.media),
    mobileMedia: normaliseMedia({ ...data.mobileMedia, ...patch.mobileMedia }, data.mobileMedia),
  });
}

/** Replace the project list (dashboard table editor). */
export function replaceProjects(list: Project[]): void {
  ensureLoaded();
  commit({ ...data, projects: normaliseProjects(list, data.projects) });
}

/** Replace the whole image-slot document (the section-wise image manager). */
export function replaceSlots(list: ImageSlot[]): void {
  ensureLoaded();
  commit({ ...data, slots: normaliseSlots(list, data.slots) });
}

/* -------------------------------------------------------------------------- */
/*  The studio document                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Publishing every slider tick would be a request per pixel dragged, so the
 * studio's own edits are written locally at once and pushed once the owner
 * stops moving things — the page never waits for the network either way.
 */
let studioPushTimer = 0;

function scheduleStudioPush(): void {
  if (!dataApiUrl || typeof window === "undefined") return;
  if (studioPushTimer) window.clearTimeout(studioPushTimer);
  studioPushTimer = window.setTimeout(() => {
    studioPushTimer = 0;
    void pushRemote();
  }, 900);
}

/** Replace the whole studio document — the visual editor's own state. */
export function replaceStudio(doc: StudioDoc): void {
  ensureLoaded();
  commit({ ...data, studio: normaliseStudio(doc) }, { push: false });
  scheduleStudioPush();
}

/** Patch the studio document: boxes, order, hidden sections, stages, motion. */
export function updateStudio(patch: Partial<StudioDoc>): void {
  ensureLoaded();
  replaceStudio({ ...data.studio, ...patch });
}

/** React helper — the studio document. */
export function useStudio(): StudioDoc {
  return useSiteData().studio;
}

/**
 * Patch one slot by id — what the manager's fields call on every edit. The id
 * is honoured, so a stale index can never write to the wrong slot.
 */
export function updateSlot(id: string, patch: Partial<ImageSlot>): void {
  ensureLoaded();
  replaceSlots(data.slots.map((entry) => (entry.id === id ? { ...entry, ...patch, id, index: entry.index, section: entry.section } : entry)));
}

export function addProject(project: Project): void {
  ensureLoaded();
  replaceProjects([...data.projects, project]);
}

export function removeProject(id: string): void {
  ensureLoaded();
  replaceProjects(data.projects.filter((p) => p.id !== id));
}

/** Restore the committed defaults from src/data/content.ts and imageSlots.ts. */
export function resetSiteData(): void {
  ensureLoaded();
  commit({
    assets: { ...DEFAULT_SITE_DATA.assets },
    media: { ...DEFAULT_SITE_DATA.media },
    mobileMedia: { ...DEFAULT_SITE_DATA.mobileMedia },
    projects: DEFAULT_SITE_DATA.projects.map((p) => ({ ...p })),
    slots: DEFAULT_SITE_DATA.slots.map((s) => ({ ...s, film: s.film ? { ...s.film } : null })),
    studio: cloneDefaultStudio(),
  });
}

/**
 * The dashboard's escape hatch: the exact JSON to paste into the repository so
 * a change becomes permanent for every hosting target, with no backend
 * required — `assetDefaults` / `mediaDefaults` / `projects` into
 * `src/data/content.ts`, and `imageSlotDefaults` into `src/data/imageSlots.ts`.
 */
export function exportSiteDataJson(): string {
  const current = getSiteData();
  return JSON.stringify(
    {
      assetDefaults: current.assets,
      mediaDefaults: current.media,
      mobileMediaDefaults: current.mobileMedia,
      projects: current.projects,
      imageSlotDefaults: current.slots,
      studioDefaults: current.studio,
    },
    null,
    2,
  );
}

/* -------------------------------------------------------------------------- */
/*  Image slots — the read side                                            */
/* -------------------------------------------------------------------------- */

/** Every slot of a section, in order, switched-off ones included. */
export function slotsOf(slots: ImageSlot[], section: ImageSectionId): ImageSlot[] {
  return slots
    .filter((entry) => entry.section === section)
    .sort((a, b) => a.index - b.index);
}

/**
 * The slots a section should actually draw: switched on and holding something,
 * either a still or a film. Empty slots exist in the document so the manager
 * can show all nine; they render nothing on the page.
 */
export function liveSlots(slots: ImageSlot[], section: ImageSectionId): ImageSlot[] {
  return slotsOf(slots, section).filter((entry) => entry.enabled && Boolean(entry.src || entry.film));
}

/** React helper — the slots one section of the page should draw. */
export function useImageSlots(section: ImageSectionId): ImageSlot[] {
  const site = useSiteData();
  return useMemo(() => liveSlots(site.slots, section), [site.slots, section]);
}

/** React helper — every slot of one section, for the manager. */
export function useSectionSlots(section: ImageSectionId): ImageSlot[] {
  const site = useSiteData();
  return useMemo(() => slotsOf(site.slots, section), [site.slots, section]);
}

/** React helper — the scroll-media config alone. */
export function useMediaConfig(): MediaConfig {
  const site = useSiteData();
  return useMemo(() => site.media, [site.media]);
}

/** React helper — the phone hero's film. */
export function useMobileMediaConfig(): MediaConfig {
  const site = useSiteData();
  return useMemo(() => site.mobileMedia, [site.mobileMedia]);
}

export type { AssetKey, ImageSectionId, ImageSlot, MediaConfig, Project, SlotAnimation, SlotFilm };
