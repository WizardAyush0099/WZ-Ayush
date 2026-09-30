import { useCallback, useEffect, useState } from "react";

/**
 * ============================================================================
 *  THEME — live, site-wide palette switching
 * ============================================================================
 *  Every theme is a set of CSS custom properties defined in `src/index.css`
 *  (`:root` for the default, `[data-theme="…"]` for the rest). Applying a
 *  theme is a single attribute flip on <html>, so the whole site — hero,
 *  sections, cards and the template previews — re-paints at once.
 *
 *  Because custom properties inherit, any element can carry its own
 *  `data-theme` and render in that palette independently. The template cards
 *  use exactly that, so each preview shows its own colours while the page
 *  around it keeps the visitor's chosen theme.
 * ============================================================================
 */

export type ThemeId = "crimson" | "verdant" | "amber" | "ocean" | "plum" | "graphite";

export type ThemeDef = {
  id: ThemeId;
  /** Display name in the palette picker. */
  name: string;
  /** One-line description of the mood. */
  blurb: string;
  /** Ink / accent / text swatch colours — UI only, mirrors the CSS tokens. */
  swatch: [string, string, string];
};

export const THEMES: ThemeDef[] = [
  {
    id: "crimson",
    name: "Crimson",
    blurb: "Near-black with a deep blood-red accent. The house default.",
    swatch: ["#050304", "#d61f26", "#ece7e1"],
  },
  {
    id: "verdant",
    name: "Verdant",
    blurb: "Green-black base, jade accent. Calm and organic.",
    swatch: ["#030604", "#22c55e", "#e9eee9"],
  },
  {
    id: "amber",
    name: "Amber",
    blurb: "Warm charcoal and gold. Hospitality and food.",
    swatch: ["#060403", "#f59e0b", "#f0eae0"],
  },
  {
    id: "ocean",
    name: "Ocean",
    blurb: "Blue-black with an azure accent. Clean and technical.",
    swatch: ["#030508", "#0ea5e9", "#e4ebf2"],
  },
  {
    id: "plum",
    name: "Plum",
    blurb: "Plum-black with a rose accent. Editorial and bold.",
    swatch: ["#070305", "#f472b6", "#f0e7ed"],
  },
  {
    id: "graphite",
    name: "Graphite",
    blurb: "Restrained monochrome with a cool silver accent.",
    swatch: ["#040405", "#94a3b8", "#ececee"],
  },
];

export const DEFAULT_THEME: ThemeId = "crimson";

/** Must match the key read by the inline bootstrap script in index.html. */
const STORAGE_KEY = "wz.theme.v1";
const CHANGE_EVENT = "wz:theme-changed";

const THEME_IDS = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as string[]).includes(value);
}

export function getThemeById(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** The theme currently persisted for this visitor. */
export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Flip the palette on <html> and remember the choice. */
export function applyTheme(id: ThemeId): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", id);
  root.style.colorScheme = "dark";
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode — the theme still applies for this visit */
  }
  window.dispatchEvent(new CustomEvent<ThemeId>(CHANGE_EVENT, { detail: id }));
}

/**
 * React binding. Returns the active theme and a setter that both persists and
 * broadcasts it, so every mounted consumer stays in sync.
 */
export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme());

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeId>).detail;
      setTheme(isThemeId(detail) ? detail : getStoredTheme());
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  // Keep the document in sync with state even before the first change.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const set = useCallback((id: ThemeId) => {
    applyTheme(id);
    setTheme(id);
  }, []);

  return [theme, set];
}
