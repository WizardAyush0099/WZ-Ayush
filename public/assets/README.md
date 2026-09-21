# Assets

Every file in this folder is a **clearly-marked placeholder** (each SVG has a
`PLACEHOLDER` comment inside it). Nothing here is copyrighted artwork — they are
original vector stand-ins so the site looks complete and cinematic out of the box.

## Replacing the Itachi artwork (recommended)

1. Drop your render into this folder, e.g. `itachi-main.webp`.
   - Use a **transparent PNG/WebP**, ideally ~1600px tall, figure anchored to the
     **bottom-centre** with breathing room on the right.
2. Compress it (WebP/AVIF, quality ~80) before shipping.
3. Open `src/data/content.ts` and point `assets.itachiMain` (and optionally
   `assets.itachiShadow`, `assets.background`, `assets.portrait`, `assets.cta`) to
   the new file, e.g. `"/assets/itachi-main.webp"`.

That's it — no component changes needed.

## Current files

| File | Used by | Notes |
| --- | --- | --- |
| `itachi-main.svg` | Hero main figure | Cut-out character, bottom-centred |
| `itachi-shadow.svg` | Hero blurred silhouette | Dark soft silhouette |
| `background.svg` | Atmosphere / backdrops | Replace with a wide still |
| `portrait.svg` | About section | Portrait crop |
| `cta.svg` | Final CTA backdrop | Wide cinematic still |
| `featured/01..04.svg` | Featured work | 16:10 landscape stills |
| `gallery/01..06.svg` | Gallery + lightbox | Mixed portrait/landscape |
| `horizontal/01..05.svg` | Horizontal scroll gallery | Tall/wide art-direction stills |

## Optional video

If you want motion backgrounds, add `/assets/videos/` with compressed MP4/WebM
files and reference them in `src/data/content.ts`. Keep clips short (< 6s),
muted, `playsinline`, and lazy-loaded.
