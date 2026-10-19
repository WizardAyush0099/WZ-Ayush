import { useEffect, useRef, useState } from "react";
import { SITE_THEMES, THEMES, useTheme, type ThemeId } from "../../lib/theme";
import SharinganMark from "./SharinganMark";

/**
 * ============================================================================
 *  THEME TOGGLE — one small mark, two choices
 * ============================================================================
 *  The header used to carry a swatch, the palette name and a popover listing
 *  every theme in the project. On a phone that row pushed the navigation off
 *  the screen, and the choice itself was noise: the main site is offered in
 *  exactly two finishes — the house red-on-black, and paper white (whose hero
 *  stays black, see `PortfolioApp`).
 *
 *  So the control is now a single round mark. Tapping it opens a compact
 *  panel with those two options and nothing else. The other palettes in
 *  `THEMES` are still defined — they belong to the template library, where a
 *  concept repaints itself, not to this site's chrome.
 *
 *  The mark itself is the Sharingan (`SharinganMark`), not a colour swatch: a
 *  swatch of two dark colours on a dark header read as an empty circle, which
 *  is exactly how it looked — like a logo someone forgot to draw.
 * ============================================================================
 */

function themeDef(id: ThemeId) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export default function ThemeToggle({ align = "right" }: { align?: "left" | "right" }) {
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = themeDef(theme);

  // Close on outside click and on Escape — a popover must never trap anyone.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Appearance: ${current.name}. Change theme`}
        title={`Appearance — ${current.name}`}
        data-cursor="hover"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-ink-950/60 backdrop-blur-md transition-colors duration-300 ${
          open ? "border-blood-500/70" : "border-bone/20 hover:border-blood-500/60"
        }`}
      >
        {/* The mark: the Sharingan, drawn in the live palette. */}
        <SharinganMark className="h-[22px] w-[22px]" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Choose a theme"
          className={`absolute top-[calc(100%+12px)] z-50 w-[190px] border border-bone/15 bg-ink-950/95 p-1.5 backdrop-blur-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="px-2 py-1.5 font-body text-[9px] uppercase tracking-cinematic text-bone-dim">
            Appearance
          </p>
          <ul className="flex flex-col">
            {SITE_THEMES.map((id) => {
              const option = themeDef(id);
              const active = option.id === theme;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setTheme(option.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-2 py-2 text-left transition-colors duration-200 ${
                      active ? "bg-blood-950/40" : "hover:bg-bone/5"
                    }`}
                  >
                    <span className="flex shrink-0 overflow-hidden rounded-sm border border-bone/15">
                      {option.swatch.map((colour) => (
                        <span key={colour} className="block h-4 w-3" style={{ background: colour }} />
                      ))}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-body text-[11px] uppercase tracking-wide2 ${
                          active ? "text-bone" : "text-bone-muted"
                        }`}
                      >
                        {option.name}
                      </span>
                      <span className="block truncate font-body text-[10px] text-bone-dim">
                        {option.family === "light" ? "Paper white" : "Red on black"}
                      </span>
                    </span>
                    {active ? (
                      <span aria-hidden="true" className="ml-auto font-body text-[11px] text-blood-400">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
