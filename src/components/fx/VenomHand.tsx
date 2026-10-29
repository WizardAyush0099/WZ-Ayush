import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useHasFinePointer, useIsTouch, usePrefersReducedMotion } from "../../lib/hooks";
import { useStudio } from "../../lib/siteData";

/**
 * ============================================================================
 *  THE VENOM HAND — the one interaction nobody forgets
 * ============================================================================
 *  A symbiote hand lives in the dark beside the closing “Start a Project”
 *  button. It is drawn as vector art, not a picture: a fanged palm, five
 *  tapered fingers and a forearm that dissolves into the section's black, with
 *  a wet specular sheen, a cold rim light and a few restrained crimson veins.
 *
 *  Behaviour, in order of what a visitor notices:
 *
 *    approach   as the pointer comes within a few hundred pixels of the button
 *               the hand rises out of the bottom of the frame — translate and
 *               scale on a CSS transition, so the emergence is a single
 *               compositor animation, not a JavaScript frame budget.
 *
 *    reach      it leans toward the pointer inside a small envelope (a few tens
 *               of pixels), springing with a lerp in a rAF that only runs while
 *               the hand is out. The fingers close slightly as it arrives.
 *
 *    retreat    the pointer leaves, the hand sinks back into the black and
 *               stops being rendered at all: the loop cancels itself the moment
 *               the spring settles, so an idle page runs no frames for this.
 *
 *  The whole layer is `pointer-events: none` and sits *behind* the section's
 *  content, so the label stays legible and the link stays clickable — the hand
 *  grips the edge of the button, never its text.
 *
 *  Phones get the same art with no tracking at all: one tap in the section
 *  plays a single grip-and-withdraw, then nothing. Reduced motion (and the
 *  dashboard's switch, `#/admin → Studio → Effects`) renders nothing.
 * ============================================================================
 */

/* The artwork's own coordinates, and how large it is drawn on screen. */
const ART_W = 320;
const ART_H = 430;
const SCALE = 0.94;
const W = ART_W * SCALE;
const H = ART_H * SCALE;
/** Where the palm's centre sits inside the artwork, in screen pixels. */
const PALM_X = 150 * SCALE;
const PALM_Y = 250 * SCALE;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** A finger pivots at its own base, so the grip is a lean, not a slide. */
function fingerStyle(x: number, y: number, degrees: number): CSSProperties {
  return {
    transformBox: "view-box",
    transformOrigin: `${x}px ${y}px`,
    transform: `rotate(calc(var(--grip, 0) * ${degrees}deg))`,
  } as CSSProperties;
}

type Props = {
  /** The button the hand grips — usually the closing call to action. */
  targetRef: RefObject<HTMLElement | null>;
  className?: string;
};

export default function VenomHand({ targetRef, className = "" }: Props) {
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();
  const fine = useHasFinePointer();
  const on = useStudio().effects.venom;

  const layerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const baseRef = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);
  const springRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, grip: 0, gripT: 0, raf: 0, started: 0 });

  /* --------------------------------------------------------------- plumbing */

  useEffect(() => {
    if (!on || reduced) return;

    const layer = layerRef.current;
    const outer = outerRef.current;
    const track = trackRef.current;
    const target = targetRef.current;
    if (!layer || !outer || !track || !target) return;

    const spring = springRef.current;

    /** Where the palm lives, pinned to the button's lower-right corner. */
    const measure = () => {
      const layerRect = layer.getBoundingClientRect();
      const buttonRect = target.getBoundingClientRect();
      // Beside the button's lower-right corner — but never off the edge of a
      // narrow window, where the hand would be clipped to a strip.
      const base = {
        x: Math.min(buttonRect.right - layerRect.left + 74, layerRect.width - 46),
        y: Math.min(buttonRect.bottom - layerRect.top + 6, layerRect.height - 24),
      };
      baseRef.current = base;
      outer.style.left = `${base.x - PALM_X}px`;
      outer.style.top = `${base.y - PALM_Y}px`;
    };

    const tick = () => {
      spring.raf = 0;
      const t = performance.now();
      const ease = 0.14;

      spring.x += (spring.tx - spring.x) * ease;
      spring.y += (spring.ty - spring.y) * ease;
      spring.grip += (spring.gripT - spring.grip) * 0.1;

      // A slow breath under the spring, so a still hand still feels alive.
      const breath = Math.sin((t - spring.started) / 1400) * 1.8;
      track.style.transform = `translate3d(${spring.x.toFixed(2)}px, ${(spring.y + breath).toFixed(2)}px, 0) rotate(${(spring.x * 0.16).toFixed(2)}deg)`;
      track.style.setProperty("--grip", spring.grip.toFixed(3));

      const settled =
        Math.abs(spring.tx - spring.x) < 0.4 &&
        Math.abs(spring.ty - spring.y) < 0.4 &&
        Math.abs(spring.gripT - spring.grip) < 0.01;

      // Keep painting while the hand is out or still springing home; once it is
      // home and the pointer is gone, stop. Nothing runs on an idle page.
      if (activeRef.current || !settled) {
        spring.raf = requestAnimationFrame(tick);
      }
    };

    const wake = () => {
      if (spring.raf) return;
      spring.started = performance.now();
      spring.raf = requestAnimationFrame(tick);
    };

    const show = (next: boolean) => {
      if (activeRef.current === next) return;
      activeRef.current = next;
      setActive(next);
      if (next) {
        spring.gripT = 1;
      } else {
        spring.tx = 0;
        spring.ty = 0;
        spring.gripT = 0;
      }
      wake();
    };

    const onResize = () => {
      baseRef.current = null;
      measure();
    };

    /**
     * Desktop: the hand wakes when the pointer comes near the button and leans
     * toward it while it is there. Measuring once and caching keeps the handler
     * to a couple of arithmetic operations per move.
     */
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const buttonRect = target.getBoundingClientRect();
      const reach = Math.min(320, window.innerWidth * 0.3);
      const near =
        event.clientX > buttonRect.left - reach &&
        event.clientX < buttonRect.right + reach &&
        event.clientY > buttonRect.top - reach &&
        event.clientY < buttonRect.bottom + reach;

      if (!near) {
        show(false);
        return;
      }

      if (!baseRef.current) measure();
      const base = baseRef.current;
      const layerRect = layer.getBoundingClientRect();
      if (!base) return;

      show(true);
      const pointerX = event.clientX - layerRect.left;
      const pointerY = event.clientY - layerRect.top;
      // Lean toward the pointer, inside a deliberately small envelope: the hand
      // is attached to the button, so it must never wander away from it.
      spring.tx = clamp((pointerX - base.x) * 0.2, -38, 34);
      spring.ty = clamp((pointerY - base.y) * 0.14, -30, 22);
      wake();
    };

    const leave = () => show(false);

    /** Phones: one tap plays a grip, with no pointer tracking at all. */
    let tapTimer = 0;
    const onTap = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const host = layer.parentElement;
      if (!host) return;
      const hostRect = host.getBoundingClientRect();
      const base = baseRef.current ?? { x: 0, y: 0 };
      const x = event.clientX - hostRect.left;
      const y = event.clientY - hostRect.top;
      if (!baseRef.current) measure();
      const anchor = baseRef.current ?? base;
      outer.style.left = `${x + 40 - PALM_X}px`;
      outer.style.top = `${y + 26 - PALM_Y}px`;
      show(true);
      window.clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => {
        show(false);
        // Hand the palm back to the button for the next approach.
        outer.style.left = `${anchor.x - PALM_X}px`;
        outer.style.top = `${anchor.y - PALM_Y}px`;
      }, 1200);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(layer);

    window.addEventListener("resize", onResize);
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", leave);
    }
    if (touch) {
      const host = layer.parentElement;
      host?.addEventListener("pointerdown", onTap, { passive: true });
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", onResize);
        window.clearTimeout(tapTimer);
        host?.removeEventListener("pointerdown", onTap);
        if (spring.raf) cancelAnimationFrame(spring.raf);
        spring.raf = 0;
      };
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", leave);
      if (spring.raf) cancelAnimationFrame(spring.raf);
      spring.raf = 0;
    };
  }, [on, reduced, fine, touch, targetRef]);

  if (!on || reduced) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[4] overflow-hidden ${className}`}
    >
      <div
        ref={outerRef}
        data-active={active ? "true" : "false"}
        className="venom-hand absolute"
        style={{ width: W, height: H, left: 0, top: 0 }}
      >
        <div ref={trackRef} className="venom-hand-track h-full w-full">
          <svg
            viewBox={`0 0 ${ART_W} ${ART_H}`}
            width={W}
            height={H}
            fill="none"
            focusable="false"
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="vh-skin" x1="0.1" y1="0" x2="0.9" y2="1">
                <stop offset="0" stopColor="#24242b" />
                <stop offset="0.3" stopColor="#111116" />
                <stop offset="0.72" stopColor="#08080b" />
                <stop offset="1" stopColor="#030304" />
              </linearGradient>
              <linearGradient id="vh-arm" x1="0" y1="0" x2="0.8" y2="1">
                <stop offset="0" stopColor="#16161b" />
                <stop offset="0.55" stopColor="#0a0a0d" />
                <stop offset="1" stopColor="#020203" />
              </linearGradient>
              <radialGradient id="vh-gloss" cx="0.35" cy="0.28" r="0.8">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
                <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.07" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="vh-rim" x1="0" y1="0" x2="0.35" y2="1">
                <stop offset="0" stopColor="#e9e6ff" stopOpacity="0.5" />
                <stop offset="0.55" stopColor="#c9c6d8" stopOpacity="0.12" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="vh-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0.55" stopColor="#fff" />
                <stop offset="0.92" stopColor="#000" />
              </linearGradient>
              <mask id="vh-fade-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={ART_W} height={ART_H}>
                <rect x="0" y="0" width={ART_W} height={ART_H} fill="url(#vh-fade)" />
              </mask>
              <filter id="vh-soft" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <filter id="vh-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
              <clipPath id="vh-palm-clip">
                <path d="M118 306C103 289 96 259 100 232C104 206 120 194 142 190C161 186 200 188 220 200C240 212 244 240 238 264C232 288 220 302 200 311C178 321 136 322 118 306Z" />
              </clipPath>
            </defs>

            {/* The crimson that the hand is lit by, bleeding out of the black. */}
            <ellipse
              cx="176"
              cy="272"
              rx="116"
              ry="128"
              filter="url(#vh-soft)"
              opacity="0.5"
              style={{ fill: "rgb(var(--accent-rgb))", fillOpacity: 0.3 }}
            />

            {/* Contact shadow, so the hand sits in the frame rather than on it. */}
            <ellipse cx="196" cy="330" rx="104" ry="42" fill="#000" opacity="0.55" filter="url(#vh-soft)" />

            {/* Forearm — dissipates into the section's darkness. */}
            <g mask="url(#vh-fade-mask)">
              <path
                d="M133 296C124 336 146 378 128 430L318 430C297 386 270 342 247 302C222 313 158 313 133 296Z"
                fill="url(#vh-arm)"
              />
              <path
                d="M138 300C132 330 146 362 140 396"
                stroke="url(#vh-rim)"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.5"
              />
              <path
                d="M254 314C266 350 288 382 302 420"
                stroke="url(#vh-rim)"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.32"
              />
              {/* Tendrils that reach for the button's corner. */}
              <path
                d="M126 306C108 312 92 326 80 344"
                stroke="#0b0b0f"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M130 318C114 330 102 348 92 366"
                stroke="#08080b"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </g>

            {/* Fingers, each pivoting at its own knuckle. */}
            <g style={fingerStyle(122, 230, -7)}>
              <path
                d="M112 232C106 208 104 160 108 118C109 102 116 94 122 96C130 99 132 110 131 126C129 166 130 208 138 226Z"
                fill="url(#vh-skin)"
              />
              <path
                d="M118 214C115 180 115 142 118 116"
                stroke="url(#vh-rim)"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.5"
              />
              <ellipse cx="122" cy="102" rx="6" ry="5" fill="#fff" opacity="0.16" filter="url(#vh-glow)" />
            </g>

            <g style={fingerStyle(158, 224, -4)}>
              <path
                d="M142 226C141 190 142 130 146 96C147 82 158 78 164 82C170 87 171 100 170 116C168 156 169 196 174 220Z"
                fill="url(#vh-skin)"
              />
              <path
                d="M151 210C150 170 151 126 155 96"
                stroke="url(#vh-rim)"
                strokeWidth="2.6"
                strokeLinecap="round"
                opacity="0.55"
              />
              <ellipse cx="160" cy="88" rx="7" ry="5" fill="#fff" opacity="0.18" filter="url(#vh-glow)" />
            </g>

            <g style={fingerStyle(196, 226, 3)}>
              <path
                d="M182 226C185 196 186 150 188 112C189 98 199 94 204 99C209 104 209 118 207 132C203 166 203 200 210 222Z"
                fill="url(#vh-skin)"
              />
              <path
                d="M190 208C192 172 193 136 196 114"
                stroke="url(#vh-rim)"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.45"
              />
              <ellipse cx="200" cy="104" rx="6" ry="5" fill="#fff" opacity="0.14" filter="url(#vh-glow)" />
            </g>

            <g style={fingerStyle(226, 244, 9)}>
              <path
                d="M212 246C216 226 222 196 226 164C228 150 238 148 243 155C246 160 244 174 241 186C235 212 232 228 236 244Z"
                fill="url(#vh-skin)"
              />
              <path
                d="M219 232C223 212 227 190 229 170"
                stroke="url(#vh-rim)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
              <ellipse cx="235" cy="160" rx="5" ry="4" fill="#fff" opacity="0.13" filter="url(#vh-glow)" />
            </g>

            <g style={fingerStyle(112, 282, 6)}>
              <path
                d="M114 292C96 286 74 268 62 250C56 241 60 230 70 230C82 231 96 244 108 256C118 266 126 276 132 284Z"
                fill="url(#vh-skin)"
              />
              <path
                d="M108 286C92 280 76 266 68 252"
                stroke="url(#vh-rim)"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.45"
              />
            </g>

            {/* Palm. */}
            <path
              d="M118 306C103 289 96 259 100 232C104 206 120 194 142 190C161 186 200 188 220 200C240 212 244 240 238 264C232 288 220 302 200 311C178 321 136 322 118 306Z"
              fill="url(#vh-skin)"
            />

            {/* Wet sheen across the palm, and the knuckles catching the light. */}
            <g clipPath="url(#vh-palm-clip)">
              <ellipse cx="152" cy="248" rx="40" ry="52" fill="url(#vh-gloss)" opacity="0.9" />
              <ellipse cx="206" cy="222" rx="18" ry="14" fill="url(#vh-gloss)" opacity="0.5" />
              <path
                d="M150 316C168 300 176 274 174 244"
                stroke="#fff"
                strokeOpacity="0.05"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M196 316C206 296 212 272 210 248"
                stroke="#fff"
                strokeOpacity="0.035"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </g>

            {/* Knuckle creases — the difference between a hand and a shadow. */}
            <g stroke="#000" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M108 232C117 239 130 239 137 229" />
              <path d="M140 224C150 231 164 231 172 221" />
              <path d="M180 226C189 233 201 233 208 223" />
              <path d="M212 246C220 251 229 251 235 244" />
              <path d="M118 288C130 296 148 299 164 295" strokeOpacity="0.32" strokeWidth="1.6" />
            </g>
            <g stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2" strokeLinecap="round" fill="none">
              <path d="M109 226C118 232 130 232 136 223" />
              <path d="M141 218C151 224 164 224 171 215" />
            </g>

            {/* Rim light down the outer edge — a cold, wet outline. */}
            <path
              d="M100 232C96 259 103 289 118 306C136 322 178 321 200 311"
              stroke="url(#vh-rim)"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M220 200C240 212 244 240 238 264"
              stroke="url(#vh-rim)"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.4"
            />

            {/* Crimson veins — restrained: two on the palm, one on the wrist. */}
            <g
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ stroke: "rgb(var(--accent-rgb))" }}
            >
              <path d="M152 302C160 280 150 264 162 244" strokeOpacity="0.45" />
              <path d="M188 308C181 288 192 272 183 252" strokeOpacity="0.32" />
              <path d="M158 366C170 338 158 316 172 300" strokeOpacity="0.24" />
            </g>
            <g filter="url(#vh-glow)" fill="none" strokeWidth="3.5" strokeLinecap="round" style={{ stroke: "rgb(var(--accent-rgb))" }}>
              <path d="M152 302C160 280 150 264 162 244" strokeOpacity="0.16" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
