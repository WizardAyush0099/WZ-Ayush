import { useEffect, useRef, useState } from "react";
import { THEMES, useTheme } from "../../lib/theme";

/**
 * A compact palette control for the header.
 *
 * Discreet by design — a small swatch that opens a popover, rather than a row
 * of loud buttons competing with the navigation. The full-size picker still
 * lives in the builder, where choosing a palette is the point.
 */
export default function ThemeToggle({ align = "right" }: { align?: "left" | "right" }) {
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

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
        aria-label={`Theme: ${current.name}. Change palette`}
        title={`Theme — ${current.name}`}
        className="flex h-9 items-center gap-2 border border-bone/15 px-2.5 transition-colors duration-300 hover:border-bone/35"
      >
        <span className="flex overflow-hidden rounded-sm border border-bone/15">
          {current.swatch.map((colour) => (
            <span key={colour} className="block h-3.5 w-2.5" style={{ background: colour }} />
          ))}
        </span>
        <span className="hidden font-body text-[10px] uppercase tracking-wide2 text-bone-muted lg:inline">
          {current.name}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Choose a palette"
          className={`absolute top-[calc(100%+10px)] z-50 w-[248px] border border-bone/15 bg-ink-950/95 p-2 backdrop-blur-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="px-2 py-2 font-body text-[9px] uppercase tracking-cinematic text-bone-dim">
            Palette
          </p>
          <ul className="flex flex-col">
            {THEMES.map((option) => {
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
                    className={`flex w-full items-center gap-3 px-2 py-2 text-left transition-colors duration-200 ${
                      active ? "bg-blood-950/40" : "hover:bg-bone/5"
                    }`}
                  >
                    <span className="flex overflow-hidden rounded-sm border border-bone/15">
                      {option.swatch.map((colour) => (
                        <span key={colour} className="block h-4 w-4" style={{ background: colour }} />
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
                        {option.family === "light" ? "Light" : "Dark"}
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
