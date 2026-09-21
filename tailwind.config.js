/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050304",
          900: "#0a0709",
          800: "#120d10",
          700: "#1b1418",
        },
        blood: {
          50: "#fff1f1",
          100: "#ffdede",
          200: "#ffbcbc",
          300: "#ff8a8a",
          400: "#f24b4b",
          500: "#d61f26",
          600: "#b31115",
          700: "#8c0b10",
          800: "#5e070b",
          900: "#3a0407",
          950: "#1e0203",
        },
        bone: {
          DEFAULT: "#ece7e1",
          muted: "#a9a29b",
          dim: "#6f6a65",
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
