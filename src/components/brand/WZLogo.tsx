import { useId } from "react";

/**
 * ============================================================================
 *  WZ AYUSH — the house seal
 * ============================================================================
 *  This is the logo the studio actually uses: a paper-white disc carrying a
 *  high-contrast serif monogram, a crimson blade cutting up through it, the
 *  wordmark, and a four-point star on its rule.
 *
 *  Two shapes of the same drawing:
 *
 *    badge   the full seal — disc, monogram, wordmark, rule. Used where there
 *            is room to read it: the footer, the title card.
 *    mark    the monogram and the blade only, drawn in `currentColor` so the
 *            header can tint it with the page's own ink. At 26px the wordmark
 *            would be a smudge, so it is not there.
 *
 *  The letterforms are `<text>` in Cinzel (already loaded by `index.html`,
 *  Georgia behind it) rather than hand-traced outlines: the drawing stays
 *  editable at any size, and the halftone that fills it is clipped to the
 *  glyphs so the texture never leaks past the ink.
 * ============================================================================
 */

const SERIF = 'Cinzel, "Trajan Pro", Georgia, "Times New Roman", serif';
const RED = "#c2101c";

type Variant = "badge" | "mark";

type Props = {
  variant?: Variant;
  className?: string;
  /** Accessible name. Pass "" to leave the drawing decorative. */
  title?: string;
};

/** The two letters, offset so the Z tucks under the W's right shoulder. */
function Letters({
  clipW,
  clipZ,
  fill,
}: {
  clipW: string;
  clipZ: string;
  fill: string;
}) {
  return (
    <>
      <text
        x="155"
        y="224"
        textAnchor="middle"
        fontFamily={SERIF}
        fontWeight={700}
        fontSize="200"
        letterSpacing="2"
        fill={fill}
        clipPath={`url(#${clipW})`}
      >
        W
      </text>
      <text
        x="271"
        y="224"
        textAnchor="middle"
        fontFamily={SERIF}
        fontWeight={700}
        fontSize="200"
        fill={fill}
        clipPath={`url(#${clipZ})`}
      >
        Z
      </text>
    </>
  );
}

/** The blade: tapered at both ends, brightest just past the middle. */
function Blade({ id }: { id: string }) {
  return (
    <>
      <path
        d="M 92 256 C 100 248 108 248 116 244 L 338 108 C 348 102 354 110 348 118 L 122 264 C 112 270 100 270 94 262 C 90 258 90 258 92 256 Z"
        fill={`url(#${id})`}
      />
      <path
        d="M 100 254 L 342 114"
        stroke="#2a0406"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />
    </>
  );
}

export default function WZLogo({ variant = "badge", className, title = "WZ Ayush" }: Props) {
  // Ids must be unique per instance — the badge appears in several places at
  // once — and free of the colons React's `useId` uses.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ink = `wz-ink-${uid}`;
  const grain = `wz-grain-${uid}`;
  const sheen = `wz-sheen-${uid}`;
  const blade = `wz-blade-${uid}`;
  const clipW = `wz-w-${uid}`;
  const clipZ = `wz-z-${uid}`;

  const a11y =
    title === ""
      ? { "aria-hidden": true as const }
      : { role: "img" as const, "aria-label": title };

  const badge = variant === "badge";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={badge ? "0 0 400 400" : "38 62 330 222"}
      className={className}
      {...a11y}
    >
      <defs>
        <clipPath id={clipW}>
          <text x="155" y="224" textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize="200" letterSpacing="2">
            W
          </text>
        </clipPath>
        <clipPath id={clipZ}>
          <text x="271" y="224" textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize="200">
            Z
          </text>
        </clipPath>

        {/* Ink: near-black with a warm lift, so it reads as printed rather
            than as a flat #000 fill. */}
        <linearGradient id={ink} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#191512" />
          <stop offset="55%" stopColor="#0d0b0a" />
          <stop offset="100%" stopColor="#221c19" />
        </linearGradient>

        {/* The halftone that gives the letters their photographic grain. */}
        <pattern id={grain} width="4.4" height="4.4" patternUnits="userSpaceOnUse">
          <circle cx="1.1" cy="1.1" r="0.85" fill="#efe9df" opacity="0.55" />
          <circle cx="3.3" cy="3.3" r="0.55" fill="#efe9df" opacity="0.3" />
        </pattern>

        <linearGradient id={sheen} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#f4efe6" stopOpacity="0" />
          <stop offset="45%" stopColor="#f4efe6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f4efe6" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={blade} x1="0" y1="1" x2="0.9" y2="0">
          <stop offset="0%" stopColor="#4d0509" />
          <stop offset="38%" stopColor="#a50d17" />
          <stop offset="72%" stopColor="#d92a33" />
          <stop offset="100%" stopColor="#6d0810" />
        </linearGradient>
      </defs>

      {badge ? (
        <>
          <circle cx="200" cy="200" r="200" fill="#fbf9f5" />
          <circle cx="200" cy="200" r="199" fill="none" stroke="rgba(18,15,13,0.10)" strokeWidth="1.4" />
        </>
      ) : null}

      {/* Letters: ink, then the grain and the sheen, all held inside the
          glyphs by the clip paths. */}
      <Letters clipW={clipW} clipZ={clipZ} fill={badge ? `url(#${ink})` : "currentColor"} />
      {badge ? (
        <>
          <rect x="30" y="40" width="340" height="210" fill={`url(#${grain})`} clipPath={`url(#${clipW})`} />
          <rect x="30" y="40" width="340" height="210" fill={`url(#${grain})`} clipPath={`url(#${clipZ})`} />
          <rect x="30" y="40" width="340" height="210" fill={`url(#${sheen})`} clipPath={`url(#${clipW})`} />
          <rect x="30" y="40" width="340" height="210" fill={`url(#${sheen})`} clipPath={`url(#${clipZ})`} />
        </>
      ) : null}

      <Blade id={blade} />

      {badge ? (
        <>
          <text
            x="212"
            y="286"
            textAnchor="middle"
            fontFamily={SERIF}
            fontWeight={500}
            fontSize="27"
            letterSpacing="8.5"
            fill="#12100e"
          >
            WZ AYUSH
          </text>

          <g stroke={RED} strokeWidth="1.3" strokeLinecap="round" opacity="0.9">
            <line x1="116" y1="330" x2="180" y2="330" />
            <line x1="220" y1="330" x2="284" y2="330" />
          </g>
          <path
            d="M 200 319 L 203.6 326.4 L 211 330 L 203.6 333.6 L 200 341 L 196.4 333.6 L 189 330 L 196.4 326.4 Z"
            fill={RED}
          />
        </>
      ) : null}
    </svg>
  );
}

/** The monogram and blade alone — the header's mark. */
export function WZMark({ className, title = "WZ Ayush" }: { className?: string; title?: string }) {
  return <WZLogo variant="mark" className={className} title={title} />;
}
