import { useId, type ReactNode } from "react";

/**
 * ============================================================================
 *  STICKER — the round house stamp
 * ============================================================================
 *  A circular sticker of type that turns on its own axis, the way a shop's
 *  wax seal or a vinyl label does. It is the one piece of the page that is
 *  always moving and never asks to be read in a straight line, which is why
 *  studios use it: it makes a layout feel hand-placed rather than gridded.
 *
 *  How it is built:
 *
 *    textPath     the words ride an SVG circle in the real font, so the ring
 *                 never goes blurry and costs nothing to resize.
 *    one id       `useId` gives every badge its own path, because two badges
 *                 sharing `#ring` would make the second one render the first
 *                 one's text (and React would warn about duplicate ids).
 *    css spin     `.spin-slow` in index.css. No JS loop; the reduced-motion
 *                 rule stops it like every other animation on the site.
 *    centre       whatever is passed as children sits still inside the ring —
 *                 a mark, an arrow, a count.
 * ============================================================================
 */
export default function StickerBadge({
  text,
  size = 96,
  durationS = 26,
  className = "",
  children,
}: {
  /** The ring copy. Keep it short — it is set on a 36em-ish circle. */
  text: string;
  /** Pixel diameter. */
  size?: number;
  /** Seconds per turn. */
  durationS?: number;
  className?: string;
  /** What sits still in the middle of the ring. */
  children?: ReactNode;
}) {
  const raw = useId();
  const pathId = `sticker-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const fontSize = 8.5;

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="spin-slow absolute inset-0 h-full w-full text-bone/45"
        style={{ animationDuration: `${durationS}s` }}
        aria-hidden="true"
      >
        <defs>
          {/*
            Radius 36 on a 100 viewBox: the baseline of the text sits inside the
            circle at every size, and the `letterSpacing` closes the ring so the
            copy never shows a gap where it starts and ends.
          */}
          <path id={pathId} d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text
          fill="currentColor"
          fontSize={fontSize}
          letterSpacing="2.4"
          style={{ fontFamily: "inherit", textTransform: "uppercase" }}
        >
          <textPath href={`#${pathId}`} startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>

      {/* A hairline ring under the type, so the sticker reads on any ground. */}
      <span
        aria-hidden="true"
        className="absolute inset-[18%] rounded-full border border-bone/12"
      />

      <span className="relative z-10 grid place-items-center">{children}</span>
    </span>
  );
}
