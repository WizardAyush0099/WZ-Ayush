import { useEffect, useState } from "react";
import {
  assetLabels,
  contact,
  mediaDefaults,
  mediaLabels,
  mobileMediaDefaults,
  type AssetKey,
  type MediaConfig,
  type ScrollMediaMode,
} from "../../data/content";
import {
  DEFAULT_SITE_DATA,
  exportSiteDataJson,
  isRemoteSiteDataEnabled,
  publishSiteData,
  resetSiteData,
  updateConfig,
  updateStudio,
  useSiteData,
} from "../../lib/siteData";
import { frameUrl } from "../media/ScrollMedia";

const fieldClass =
  "w-full border border-bone/15 bg-ink-950 px-3 py-2.5 font-mono text-xs text-bone placeholder:text-bone-dim focus:border-blood-500/70 focus:outline-none";
const labelClass = "mb-2 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim";

const MODES: ScrollMediaMode[] = ["scene", "video", "sequence"];

type Status = { ok: boolean; detail: string } | null;

/**
 * ============================================================================
 *  MEDIA — where the owner points the site at their own artwork
 * ============================================================================
 *  Two jobs:
 *
 *   1. Artwork paths. Upload a file to GitHub (`public/assets/…`), then paste
 *      either a repo-relative path (`assets/hero.webp`), an absolute path
 *      (`/WZ-Ayush/assets/hero.webp`) or a full URL. All three are accepted
 *      and normalised, so the same value works on Vercel and on GitHub Pages.
 *
 *   2. The cinematic scroll media: the procedural 3D scene, a looping video,
 *      or a scroll-scrubbed image sequence. A ZIP is never offered because no
 *      browser can play one — see docs/ASSET_WORKFLOW.md.
 * ============================================================================
 */
export default function MediaPanel() {
  const site = useSiteData();
  const [assets, setAssets] = useState<Record<AssetKey, string>>(site.assets);
  const [media, setMedia] = useState<MediaConfig>(site.media);
  const [mobileMedia, setMobileMedia] = useState<MediaConfig>(site.mobileMedia);
  /**
   * The two heroes are edited side by side, never mixed: the desktop run and
   * the phone run are separate films with separate folders, counts and lengths.
   * This switch chooses which one the controls below write.
   */
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  // Keep the form aligned when the shared document arrives.
  useEffect(() => {
    setAssets(site.assets);
    setMedia(site.media);
    setMobileMedia(site.mobileMedia);
  }, [site.assets, site.media, site.mobileMedia]);

  const active = device === "desktop" ? media : mobileMedia;
  const setActive = (next: MediaConfig) =>
    device === "desktop" ? setMedia(next) : setMobileMedia(next);
  const activeDefaults = device === "desktop" ? mediaDefaults : mobileMediaDefaults;

  const dirty =
    JSON.stringify(assets) !== JSON.stringify(site.assets) ||
    JSON.stringify(media) !== JSON.stringify(site.media) ||
    JSON.stringify(mobileMedia) !== JSON.stringify(site.mobileMedia);

  const save = async (publish: boolean) => {
    setBusy(true);
    setStatus(null);
    updateConfig({ assets, media, mobileMedia });
    /*
     * The hero's run length is one number with two doors onto it: this field,
     * and the Studio tab's Motion panel (which is where the film's own feel
     * lives). Writing it through `updateStudio` keeps them from ever
     * disagreeing about how long the opening run lasts.
     */
    const vh = Number.parseFloat(media.scrollLength);
    if (Number.isFinite(vh) && vh > 0) {
      updateStudio({ motion: { ...site.studio.motion, heroScrollVh: vh } });
    }
    if (!publish) {
      setStatus({ ok: true, detail: "Saved in this browser. Publish to reach every visitor." });
      setBusy(false);
      return;
    }
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
          "Copied. Paste over assetDefaults / mediaDefaults / projects in src/data/content.ts to make it permanent in the repository.",
      });
    } catch {
      setStatus({ ok: false, detail: "Clipboard unavailable — use the JSON preview below." });
    }
  };

  const firstFrame =
    active.frameDir && active.frameCount > 0 ? frameUrl(active, 0) : "";

  return (
    <div className="flex flex-col gap-8">
      {/* ---------------------------------------------------------- artwork */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Artwork paths
          </h2>
          <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
            Upload the file to your repository under{" "}
            <code className="text-bone">public/assets/</code>, then paste its path here. Accepted:{" "}
            <code className="text-bone">assets/hero.webp</code> (repo-relative),{" "}
            <code className="text-bone">/WZ-Ayush/assets/hero.webp</code> (absolute) or a full{" "}
            <code className="text-bone">https://</code> URL.
          </p>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          {(Object.keys(assetLabels) as AssetKey[]).map((key) => (
            <div key={key} className="flex gap-4">
              <div className="h-20 w-28 shrink-0 overflow-hidden border border-bone/10 bg-ink-950">
                <img
                  src={assets[key] || DEFAULT_SITE_DATA.assets[key]}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <label className={labelClass} htmlFor={`asset-${key}`}>
                  {assetLabels[key]}
                </label>
                <input
                  id={`asset-${key}`}
                  className={fieldClass}
                  value={assets[key]}
                  onChange={(e) => setAssets({ ...assets, [key]: e.target.value })}
                  placeholder={DEFAULT_SITE_DATA.assets[key]}
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setAssets({ ...assets, [key]: DEFAULT_SITE_DATA.assets[key] })}
                  className="mt-2 font-body text-[10px] uppercase tracking-wide2 text-bone-dim underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
                >
                  Reset to default
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- scroll media */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Cinematic scroll media
          </h2>
          <p className="mt-2 max-w-[76ch] font-body text-xs leading-relaxed text-bone-muted">
            Two films, one per screen: <span className="text-bone">Desktop</span> plays the wide
            sequence; <span className="text-bone">Phone</span> plays the portrait 3D run built from
            <code className="mx-1 text-bone">PH Hero/ph1 + ph2 + ph3</code>(240 WebP stills).
            <span className="text-bone"> Sequence</span> is the lightest option on phones — export
            stills, not a ZIP. If a configured film fails the hero falls back to the 3D scene.
          </p>
          <div className="mt-4 flex gap-2" role="tablist" aria-label="Hero screen">
            {(
              [
                ["desktop", "Desktop hero", media.mode, media.frameCount],
                ["phone", "Phone hero · 3D", mobileMedia.mode, mobileMedia.frameCount],
              ] as const
            ).map(([id, label, mode, count]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={device === id}
                onClick={() => setDevice(id)}
                className={`border px-4 py-2.5 text-left transition-colors duration-300 ${
                  device === id
                    ? "border-blood-500/70 bg-blood-950/30"
                    : "border-bone/15 hover:border-bone/35"
                }`}
              >
                <span className="block font-body text-[11px] uppercase tracking-wide2 text-bone">
                  {label}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] text-bone-dim">
                  {mode} · {count} frames
                </span>
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-col gap-6 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((mode) => {
              const on = active.mode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive({ ...active, mode })}
                  className={`border p-4 text-left transition-colors duration-300 ${
                    on ? "border-blood-500/70 bg-blood-950/30" : "border-bone/15 hover:border-bone/35"
                  }`}
                >
                  <span className="block font-body text-[11px] uppercase tracking-wide2 text-bone">
                    {mode}
                  </span>
                  <span className="mt-1 block font-body text-[11px] leading-relaxed text-bone-dim">
                    {mediaLabels[mode]}
                  </span>
                </button>
              );
            })}
          </div>

          {active.mode === "video" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`${device}-media-video`}>
                  Video file (.mp4 or .webm)
                </label>
                <input
                  id={`${device}-media-video`}
                  className={fieldClass}
                  value={active.videoSrc}
                  onChange={(e) => setActive({ ...active, videoSrc: e.target.value })}
                  placeholder="assets/media/hero.mp4"
                  spellCheck={false}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${device}-media-video-poster`}>
                  Poster image (shown while it loads)
                </label>
                <input
                  id={`${device}-media-video-poster`}
                  className={fieldClass}
                  value={active.poster}
                  onChange={(e) => setActive({ ...active, poster: e.target.value })}
                  placeholder="assets/media/hero-poster.webp"
                  spellCheck={false}
                />
              </div>
            </div>
          ) : null}

          {active.mode === "sequence" ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor={`${device}-media-frames`}>
                  Frame folder
                </label>
                <input
                  id={`${device}-media-frames`}
                  className={fieldClass}
                  value={active.frameDir}
                  onChange={(e) => setActive({ ...active, frameDir: e.target.value })}
                  placeholder={activeDefaults.frameDir || "assets/sequence"}
                  spellCheck={false}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${device}-media-count`}>
                  Frame count
                </label>
                <input
                  id={`${device}-media-count`}
                  type="number"
                  min={1}
                  max={600}
                  className={fieldClass}
                  value={active.frameCount || ""}
                  onChange={(e) => setActive({ ...active, frameCount: Number(e.target.value) })}
                  placeholder={String(activeDefaults.frameCount)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${device}-media-ext`}>
                  Extension
                </label>
                <select
                  id={`${device}-media-ext`}
                  className={fieldClass}
                  value={active.frameExt}
                  onChange={(e) =>
                    setActive({ ...active, frameExt: e.target.value as MediaConfig["frameExt"] })
                  }
                >
                  <option value="webp">webp</option>
                  <option value="avif">avif</option>
                  <option value="jpg">jpg</option>
                  <option value="png">png</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className={labelClass} htmlFor={`${device}-media-poster`}>
                  Poster (shown before the first frame decodes)
                </label>
                <input
                  id={`${device}-media-poster`}
                  className={fieldClass}
                  value={active.poster}
                  onChange={(e) => setActive({ ...active, poster: e.target.value })}
                  placeholder={activeDefaults.poster}
                  spellCheck={false}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="font-body text-[11px] leading-relaxed text-bone-dim">
                  Frames are read as{" "}
                  <code className="text-bone-muted">{active.frameDir || "assets/sequence"}/000.{active.frameExt}</code>{" "}
                  → {String(Math.max(0, active.frameCount - 1)).padStart(3, "0")}.
                  {firstFrame ? " First frame:" : ""}
                </p>
                {firstFrame ? (
                  <img
                    src={firstFrame}
                    alt=""
                    className="mt-3 h-28 border border-bone/10 object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            {device === "desktop" ? (
              <div>
                <label className={labelClass} htmlFor="media-length">
                  Scroll length (how long the effect lasts)
                </label>
                <input
                  id="media-length"
                  className={fieldClass}
                  value={active.scrollLength}
                  onChange={(e) => setActive({ ...active, scrollLength: e.target.value })}
                  placeholder={activeDefaults.scrollLength}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="border border-bone/10 bg-ink-950 px-4 py-3">
                <p className="font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
                  Run length
                </p>
                <p className="mt-1 font-body text-xs leading-relaxed text-bone-muted">
                  {site.studio.mobile.scrollVh.toFixed(1)} screens — set it, with the phone's dolly,
                  parallax and stage height, in <span className="text-bone">Studio → Motion</span>.
                </p>
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor={`${device}-media-note`}>
                Source note (for your own records)
              </label>
              <input
                id={`${device}-media-note`}
                className={fieldClass}
                value={active.sourceNote}
                onChange={(e) => setActive({ ...active, sourceNote: e.target.value })}
                placeholder="e.g. Blender render, 120 frames, CC0 source"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => void save(false)}
          className="border border-bone/20 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/40 hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save(true)}
          className="border border-blood-600/70 bg-blood-600/10 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-500 hover:bg-blood-600/20 disabled:opacity-40"
        >
          {busy ? "Publishing…" : "Save & publish"}
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
            if (window.confirm("Restore the artwork, media and projects committed in the source?")) {
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
          className={`border px-4 py-3 font-body text-xs ${
            status.ok
              ? "border-emerald-400/40 bg-emerald-950/20 text-emerald-200/90"
              : "border-blood-600/50 bg-blood-950/40 text-blood-200"
          }`}
        >
          {status.detail}
        </p>
      ) : null}

      <p className="font-body text-xs leading-relaxed text-bone-dim">
        Without a shared backend these values live in this browser only, and the committed files in{" "}
        <code className="text-bone-muted">src/data/content.ts</code> remain the source of truth for
        every visitor. Full instructions:{" "}
        <code className="text-bone-muted">docs/ASSET_WORKFLOW.md</code>
        {isRemoteSiteDataEnabled ? "." : " — no backend is configured for this build."}
      </p>

      <p className="font-body text-xs leading-relaxed text-bone-dim">
        Questions about a brief? {contact.email} · {contact.whatsappDisplay}
      </p>
    </div>
  );
}
