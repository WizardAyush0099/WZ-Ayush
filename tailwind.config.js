/** @type {import('tailwindcss').Config} */

/*
 * Every colour is driven by a CSS custom property (`--*-rgb`, a space
 * separated channel triplet). `:root` in src/index.css defines the default
 * "Crimson" theme and `[data-theme="…"]` blocks override it, so switching a
 * single attribute on <html> re-themes the entire site — including every
 * opacity modifier (`bg-ink-950/70`) which keeps working via `<alpha-value>`.
 */
const rgb = (name) => `rgb(var(${name}) / <alpha-value>)`;

const ramp = (prefix, keys) =>
  Object.fromEntries(keys.map((k) => [k, rgb(`--${prefix}-${k}-rgb`)]));

const BLOOD_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const INK_KEYS = [950, 900, 800, 700];

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: ramp("ink", INK_KEYS),
        blood: ramp("blood", BLOOD_KEYS),
        bone: {
          DEFAULT: rgb("--bone-rgb"),
          muted: rgb("--bone-muted-rgb"),
          dim: rgb("--bone-dim-rgb"),
        },
      },
      fontFamily: {
        display: ['"Cinzel"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        accent: ['"Cinzel"', "Georgia", "serif"],
      },
      letterSpacing: {
        cinematic: "0.42em",
        wide2: "0.22em",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%,100%": { opacity: "0.35" },
          "50%": { opacity: "0.75" },
        },
        "scroll-pulse": {
          "0%": { transform: "translateY(-40%)", opacity: "0" },
          "40%": { opacity: "1" },
          "100%": { transform: "translateY(120%)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.9s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 5s ease-in-out infinite",
        "scroll-pulse": "scroll-pulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
