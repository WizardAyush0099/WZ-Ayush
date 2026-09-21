# Ayush — Portfolio

A premium, cinematic, animation-heavy personal portfolio with the interaction
quality of a high-end motion-design site. Currently features **Study Hub**.

> The original cinematic brief this design implements lives in
> `freebuff_itachi_website_prompt.txt`. All copy and projects are now
> portfolio content — see `src/data/content.ts`.

## Stack

- **Vite + React + TypeScript**
- **GSAP + ScrollTrigger** — scroll-driven, scrubbed, reversible sequences
- **Lenis** — smooth scrolling wired into the GSAP ticker
- **Tailwind CSS** — theme tokens in `tailwind.config.js` + `src/index.css`
- Canvas 2D particles (embers + crows) and the Web Audio API for ambient sound

No other runtime dependencies were added where CSS/canvas could do the job.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun install` | install dependencies |
| `bun run dev` | dev server on `0.0.0.0` (Vite, port 5173 or `$PORT`) |
| `bun run build` | production build to `dist/` (root-relative URLs) |
| `VITE_BASE=./ bun run build` | build for sub-path hosting (GitHub Pages) |
| `bun run typecheck` | `tsc -b --noEmit` |

## Structure

```
public/assets/          replaceable artwork (see assets/README.md)
src/
  data/content.ts       ALL copy, nav, projects, gallery + asset paths
  lib/
    gsap.ts             GSAP + ScrollTrigger registration
    scroll.ts           Lenis singleton + scrollTo helpers
    hooks.ts            reduced-motion / pointer / device-tier hooks
    ambient.ts          procedural ambient drone (no audio files)
    fx.ts               crow-transition event bus
    useCrowCue.ts       fire a crow transition when a section enters
  components/
    Preloader.tsx       cinematic load sequence
    CustomCursor.tsx    interpolated cursor w/ VIEW / EXPLORE labels
    Navbar.tsx          fixed nav + animated mobile menu
    SoundToggle.tsx     muted-by-default ambient toggle (pref remembered)
    fx/                 EmberCanvas, CrowCanvas, Atmosphere (grain/vignette)
    hero/Hero.tsx       layered parallax hero + scroll transition
    hero/Sharingan.tsx  rotating Sharingan / Mangekyo pattern
    common/             Reveal primitives, Lightbox provider
    sections/           Story, FeaturedWork, HorizontalGallery, About,
                        Gallery, FinalCTA, Footer
```

## Customising

**Everything user-facing is in `src/data/content.ts`.** Copy, project entries,
gallery frames and asset paths are all there — no component edits required.

**Artwork.** Every file under `public/assets/` is an original, clearly-marked
SVG placeholder. To swap in your own render:

1. Add `public/assets/hero-figure.webp` (transparent, subject bottom-centred).
2. Point `assets.heroFigure` in `src/data/content.ts` at it.

Details and the full asset table are in `public/assets/README.md`.

## Motion, performance & accessibility

- Scroll timelines are **tied to progress** (`scrub`) and reverse when scrolling up.
- Animations use **transform/opacity/clip-path** only, for GPU-friendly work.
- Particle counts scale with viewport width and device tier; canvases pause when
  the tab is hidden.
- `prefers-reduced-motion` is respected everywhere: smooth scroll, parallax,
  particles, crows and reveals are all disabled and content stays fully usable.
- Keyboard navigation works throughout; the lightbox supports `Esc` / arrows and
  traps focus; contrast, focus rings, semantic landmarks and alt text are in place.
- Sound is **muted by default**, starts only from a user gesture, and the
  preference is remembered in `localStorage`.
