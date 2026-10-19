/**
 * ============================================================================
 *  STUDIO MARK — the house seal, as vector
 * ============================================================================
 *  The same geometry as `public/assets/favicon.svg` (the tab icon), rebuilt as
 *  a component so the mark in the header, the footer and the browser tab are
 *  literally the same drawing: an outer ring, an inner ring, three spokes and
 *  a core. It is drawn with bare paths and shapes — no image request, no raster
 *  asset, sharp at any size, and about 400 bytes of markup.
 *
 *  Colours come from the theme, not from constants: the rings draw in
 *  `currentColor` (so they take the ink of whatever they sit in) and the spokes
 *  and core use `--accent-rgb`, which every theme redefines. Switch the site to
 *  Verdant or Ocean and the seal follows.
 *
 *  `label` is deliberately optional. Beside a wordmark the mark is decoration
 *  and must stay out of the accessibility tree — pass `null`.
 * ============================================================================
 */

type StudioMarkProps = {
  className?: string;
  /** Accessible name, or `null` when a visible wordmark already says it. */
  label?: string | null;
};

export default function StudioMark({ className, label = null }: StudioMarkProps) {
  const accent = { stroke: "rgb(var(--accent-rgb))", fill: "rgb(var(--accent-rgb))" };

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}

      <circle
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        opacity="0.45"
      />
      <circle
        cx="32"
        cy="32"
        r="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.28"
      />

      {/* The core, then the three spokes spanning from it. */}
      <circle cx="32" cy="32" r="6" style={accent} />
      <g strokeWidth="3.4" strokeLinecap="round" style={accent}>
        <line x1="32" y1="32" x2="32" y2="16" />
        <line x1="32" y1="32" x2="46" y2="40" />
        <line x1="32" y1="32" x2="18" y2="40" />
      </g>
    </svg>
  );
}
