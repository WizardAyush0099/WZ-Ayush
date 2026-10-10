import { useMemo, useSyncExternalStore } from "react";
import {
  assetDefaults,
  mediaDefaults,
  projects as defaultProjects,
  type AssetKey,
  type MediaConfig,
  type Project,
} from "../data/content";
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
  media: MediaConfig;
};

export type SiteData = SiteConfig & { projects: Project[] };

export const DEFAULT_SITE_DATA: SiteData = {
  assets: { ...assetDefaults },
  media: { ...mediaDefaults },
  projects: defaultProjects.map((p) => ({ ...p })),
};

/*
 * v2: the shipped default media became the 300-frame scroll sequence, so a
 * document cached under the old key (whose `mode` still said "scene") would
 * silently pin the hero to the procedural scene. Bumping the key lets the new
 * default reach every returning visitor; dashboard edits made from here on
 * persist normally.
 */
const STORAGE_KEY = "wz.site.v2";
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

function normaliseAssetPath(value: unknown, fallback: string): string {
  const text = asString(value, "").trim();
  if (!text) return fallback;
  /*
   * Accept three shapes and store one:
   *   assets/foo.webp          → BASE_URL + assets/foo.webp  (in-repo file)
   *   /WZ-Ayush/assets/foo.webp→ used as-is                  (absolute path)
   *   https://cdn…/foo.webp    → used as-is                  (external)
   */
  if (/^(https?:)?\/\//.test(text) || text.startsWith("data:")) return text;
  if (text.startsWith("/")) return text;
  return `${import.meta.env.BASE_URL}${text.replace(/^\.?\//, "")}`;
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

  return {
    mode,
    videoSrc: source.videoSrc ? normaliseAssetPath(source.videoSrc, "") : "",
    frameDir: source.frameDir ? normaliseAssetPath(source.frameDir, "") : "",
    frameCount: Number.isFinite(count) ? Math.max(0, Math.min(1200, Math.round(count))) : base.frameCount,
    frameExt,
    poster: source.poster ? normaliseAssetPath(source.poster, "") : "",
    scrollLength: asString(source.scrollLength, base.scrollLength).trim() || base.scrollLength,
    sourceNote: asString(source.sourceNote, base.sourceNote),
  };
}

function normaliseProjects(input: unknown, base: Project[]): Project[] {
  if (!Array.isArray(input)) return base;
  const list = input
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object")
    .map((p, i) => ({
      id: asString(p.id, `project-${i + 1}`),
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
      showInLiveStrip: p.showInLiveStrip === undefined ? true : Boolean(p.showInLiveStrip),
    }))
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
    projects: normaliseProjects(doc.projects, DEFAULT_SITE_DATA.projects),
  };
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  applyDocument(safeParse(window.localStorage.getItem(STORAGE_KEY)));
  void pullRemote();
  window.addEventListener(CHANGE_EVENT, () => notify());
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
    const raw = (await res.json()) as { config?: Partial<SiteConfig>; projects?: unknown };
    const next: SiteData = {
      assets: normaliseAssets(raw.config?.assets, data.assets),
      media: normaliseMedia(raw.config?.media, data.media),
      projects: normaliseProjects(raw.projects, data.projects),
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
        config: { assets: data.assets, media: data.media },
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
  });
}

/** Replace the project list (dashboard table editor). */
export function replaceProjects(list: Project[]): void {
  ensureLoaded();
  commit({ ...data, projects: normaliseProjects(list, data.projects) });
}

export function addProject(project: Project): void {
  ensureLoaded();
  replaceProjects([...data.projects, project]);
}

export function removeProject(id: string): void {
  ensureLoaded();
  replaceProjects(data.projects.filter((p) => p.id !== id));
}

/** Restore the committed defaults from src/data/content.ts. */
export function resetSiteData(): void {
  ensureLoaded();
  commit({
    assets: { ...DEFAULT_SITE_DATA.assets },
    media: { ...DEFAULT_SITE_DATA.media },
    projects: DEFAULT_SITE_DATA.projects.map((p) => ({ ...p })),
  });
}

/**
 * The dashboard's escape hatch: the exact JSON to paste into
 * `src/data/content.ts` so a change becomes permanent in the repository for
 * every hosting target, with no backend required.
 */
export function exportSiteDataJson(): string {
  const current = getSiteData();
  return JSON.stringify(
    {
      assetDefaults: current.assets,
      mediaDefaults: current.media,
      projects: current.projects,
    },
    null,
    2,
  );
}

/** React helper — the scroll-media config alone. */
export function useMediaConfig(): MediaConfig {
  const site = useSiteData();
  return useMemo(() => site.media, [site.media]);
}

export type { AssetKey, MediaConfig, Project };
