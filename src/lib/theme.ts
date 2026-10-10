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

export type ThemeId =
  | "crimson"
  | "verdant"
  | "amber"
  | "ocean"
  | "plum"
  | "graphite"
  | "midnight"
  | "neon"
  | "warm"
  | "daylight";

export type ThemeDef = {
  id: ThemeId;
  /** Display name in the palette picker. */
  name: string;
  /** One-line description of the mood. */
  blurb: string;
  /** Ink / accent / text swatch colours — UI only, mirrors the CSS tokens. */
  swatch: [string, string, string];
  /** `color-scheme` applied to <html> so form controls match. */
  scheme: "dark" | "light";
  /** Grouping shown in the builder's theme step. */
  family: "dark" | "light";
};

export const THEMES: ThemeDef[] = [
  {
    id: "crimson",
    name: "Crimson",
    blurb: "Near-black with a deep blood-red accent. The house default.",
    swatch: ["#050304", "#d61f26", "#ece7e1"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "verdant",
    name: "Verdant",
    blurb: "Green-black base, jade accent. Calm and organic.",
    swatch: ["#030604", "#22c55e", "#e9eee9"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "amber",
    name: "Amber",
    blurb: "Warm charcoal and gold. Hospitality and food.",
    swatch: ["#060403", "#f59e0b", "#f0eae0"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "ocean",
    name: "Ocean",
    blurb: "Blue-black with an azure accent. Clean and technical.",
    swatch: ["#030508", "#0ea5e9", "#e4ebf2"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "plum",
    name: "Plum",
    blurb: "Plum-black with a rose accent. Editorial and bold.",
    swatch: ["#070305", "#f472b6", "#f0e7ed"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "graphite",
    name: "Graphite",
    blurb: "Restrained monochrome with a cool silver accent.",
    swatch: ["#040405", "#94a3b8", "#ececee"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "midnight",
    name: "Midnight",
    blurb: "Deep indigo night with a soft violet accent. Quiet and premium.",
    swatch: ["#04050c", "#818cf8", "#e2e5f2"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "neon",
    name: "Neon",
    blurb: "Black with electric cyan. For tech and gaming brands.",
    swatch: ["#020406", "#22d3ee", "#e2fafc"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "warm",
    name: "Terracotta",
    blurb: "Warm charcoal and clay. Handmade, food, craft.",
    swatch: ["#080503", "#ea580c", "#f5ece2"],
    scheme: "dark",
    family: "dark",
  },
  {
    id: "daylight",
    name: "Daylight",
    blurb: "The light theme — paper-white ground, deep crimson accents.",
    swatch: ["#faf9f7", "#b91c1c", "#181716"],
    scheme: "light",
    family: "light",
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
  const def = getThemeById(id);
  const root = document.documentElement;
  root.setAttribute("data-theme", id);
  root.style.colorScheme = def.scheme;
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
