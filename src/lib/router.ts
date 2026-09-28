import { useEffect, useState } from "react";

/**
 * ============================================================================
 *  HASH ROUTER
 * ============================================================================
 *  The site is a static SPA that ships to GitHub Pages *and* to a Freebuff
 *  preview, sometimes under a sub-path — and GitHub Pages cannot do
 *  server-side rewrites. Hash routing therefore avoids every 404-on-refresh
 *  problem: `.../#/admin` always resolves to index.html, everywhere.
 * ============================================================================
 */

/** Normalise a location hash into a route path ("/", "/admin", ...). */
function readRoute(): string {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw || raw === "/") return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/** Current route, kept in sync with the location hash. */
export function useHashRoute(): string {
  const [route, setRoute] = useState<string>(() =>
    typeof window === "undefined" ? "/" : readRoute(),
  );

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

/** Navigate to a route (hash-based, so it works on static hosting). */
export function navigate(path: string): void {
  const next = path.startsWith("/") ? path : `/${path}`;
  if (readRoute() === next) return;
  window.location.hash = next;
  window.scrollTo({ top: 0, behavior: "auto" });
}

/** Anchor-markup-friendly link handler. */
export function linkTo(path: string): string {
  return `#${path.startsWith("/") ? path : `/${path}`}`;
}
