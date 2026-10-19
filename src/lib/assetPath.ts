/**
 * ============================================================================
 *  ASSET PATHS — one normaliser, every path the owner pastes
 * ============================================================================
 *  Artwork paths arrive from three places — the Artwork tab, the Images tab and
 *  the Studio tab's 3D runs — and all three accept the same shapes. Having one
 *  function for it is what keeps them honest: a folder that resolves in one
 *  place resolves in the others, including on GitHub Pages, where assets live
 *  under a sub-path (`/WZ-Ayush/…`) and a bare relative path would 404.
 *
 *  It lives outside `siteData.ts` because the studio document is normalised
 *  without it (and `studio.ts` must not import the store it is stored in).
 * ============================================================================
 */

/**
 * Accept these shapes and store one:
 *
 *   assets/foo.webp           → BASE_URL + assets/foo.webp   (in-repo file)
 *   /WZ-Ayush/assets/foo.webp → used as-is                   (absolute path)
 *   https://cdn…/foo.webp     → used as-is                   (external)
 *   data:image/webp;base64,…  → used as-is                   (inlined upload)
 *   idb:<image id>            → used as-is (upload held in IndexedDB by
 *                               `src/lib/imageStore.ts`, resolved at render
 *                               time, so the site document stays tiny)
 *
 * The one shape that needs rewriting is the easiest one to copy by accident:
 * GitHub's own file URL. `github.com/<user>/<repo>/blob/main/<path>` is an HTML
 * page, so pasting it into an `<img>` renders nothing. It is rewritten to the
 * raw host — which is the file — so “upload to GitHub, copy the path, paste it
 * here” works whichever of the two links the owner copies. The same rewrite is
 * what makes a folder pasted as a blob URL work for a frame run.
 */
export function normaliseAssetPath(value: unknown, fallback = ""): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;
  const github = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^?#]+)/.exec(text);
  if (github) return `https://raw.githubusercontent.com/${github[1]}/${github[2]}/${github[3]}`;
  if (/^(https?:)?\/\//.test(text)) return text;
  if (/^(data|blob|idb):/.test(text)) return text;
  if (text.startsWith("/")) return text;
  return `${import.meta.env.BASE_URL}${text.replace(/^\.?\//, "")}`;
}
