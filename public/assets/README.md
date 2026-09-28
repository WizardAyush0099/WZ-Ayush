# Assets

Three kinds of artwork live here:

1. **The 3D hero** — `models/` holds an optional `.glb` character model. The
   hero itself is a live WebGL scene generated at runtime, so it needs no files.
2. **Product mockups** — `featured/` contains designed interface mockups for the
   four projects (Study Hub, FitLife Blueprint, Guitar Theory Lab, E-book Store).
   These are original vector art, not photographs.
3. **Atmospheric stills** — `gallery/` and `horizontal/` are the abstract
   backdrops used by the archive and the pinned reel.

Everything here is original work produced for this project, so it is safe to
ship as-is.

## The 3D hero

The hero renders real geometry (`src/components/hero/NinjaScene.tsx`): a 3D
Mangekyo eye, a crow swarm on elliptical flight paths, and an ember field.

To use your own character model, drop it in and change nothing else:

```
public/assets/models/hero.glb
```

It is auto-framed, centred and slowly rotated beside the eye. See
`models/README.md` for where to find a suitable CC-licensed model.

## Current files

| File | Used by | Notes |
| --- | --- | --- |
| `models/hero.glb` | Hero (optional) | Any glTF 2.0 character, < ~5 MB |
| `hero-shadow.svg` | Hero grounding silhouette | Blurred, low opacity |
| `portrait.svg` | About section | Rim-lit figure, 4:5 crop |
| `background.svg` | Atmosphere / backdrops | Wide atmospheric still |
| `cta.svg` | Final CTA backdrop | Wide cinematic still |
| `featured/01-study-hub.svg` | Study Hub | Dashboard mockup |
| `featured/02-fitlife.svg` | FitLife Blueprint | Training-plan mockup |
| `featured/03-guitar-lab.svg` | Guitar Theory Lab | Fretboard mockup |
| `featured/04-ebook-store.svg` | E-book Store | Storefront mockup |
| `gallery/01..06.svg` | Archive + lightbox | Mixed portrait/landscape |
| `horizontal/01..05.svg` | Horizontal reel | Tall/wide art-direction stills |

## Swapping in your own images

Point the entry in `src/data/content.ts` at your file — for example:

```ts
{ src: `${base}assets/gallery/07.webp`, alt: "…", caption: "…", span: "tall", rotate: -1 }
```

Compress to WebP/AVIF at roughly quality 80 before shipping.

## Images added at runtime

Images uploaded from `#/admin` → **Images** are stored in the browser
(IndexedDB), not in this folder. They render **before** these built-in frames
in the Archive gallery and carry a small “New” badge. Deleting them there
restores the artwork in this folder.
