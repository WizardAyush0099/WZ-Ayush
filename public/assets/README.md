# Assets

Every file in this folder is a **clearly-marked placeholder** (each SVG contains a
`PLACEHOLDER` comment). They are original vector stand-ins so the site looks
complete and cinematic out of the box — nothing here is third-party artwork.

## Replacing the hero artwork (recommended)

1. Drop your image into this folder, e.g. `hero-figure.webp`.
   - Use a **transparent PNG/WebP**, ideally ~1600px tall, subject anchored to the
     **bottom-centre** with breathing room on the right.
   - Compress it (WebP/AVIF, quality ~80) before shipping.
2. Open `src/data/content.ts` and point `assets.heroFigure` (and optionally
   `assets.heroShadow`, `assets.background`, `assets.portrait`, `assets.cta`) at
   the new file, e.g. `\`${base}assets/hero-figure.webp\``.

That's it — no component changes needed.

## Current files

| File | Used by | Notes |
| --- | --- | --- |
| `hero-figure.svg` | Hero main figure | Cut-out subject, bottom-centred |
| `hero-shadow.svg` | Hero blurred silhouette | Dark soft silhouette behind the figure |
| `background.svg` | Atmosphere / backdrops | Replace with a wide still |
| `portrait.svg` | About section | Portrait crop (4:5 reads best) |
| `cta.svg` | Final CTA backdrop | Wide cinematic still |
| `featured/01..04.svg` | Featured work | 16:10 landscape stills |
| `gallery/01..06.svg` | Gallery + lightbox | Mixed portrait/landscape |
| `horizontal/01..05.svg` | Horizontal reel | Tall/wide art-direction stills |

## Optional video

For motion backgrounds, add `/assets/videos/` with compressed MP4/WebM files and
reference them in `src/data/content.ts`. Keep clips short (< 6s), muted,
`playsinline` and lazy-loaded.
