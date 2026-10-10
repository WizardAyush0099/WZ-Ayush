# Assets

All artwork the site renders lives here. Everything is original work produced for this project, so
it is safe to ship as-is — and all of it is replaceable from the dashboard without touching code.

**Full instructions: [`docs/ASSET_WORKFLOW.md`](../../docs/ASSET_WORKFLOW.md)** — how to upload,
which path formats work on Vercel vs GitHub Pages, and how to set up video or a scroll-scrubbed
image sequence.

## Quick version

1. Drop your file in this folder (or a subfolder), e.g. `public/assets/hero.webp`.
2. Open `#/admin` → **Artwork** and paste the **repo-relative** path: `assets/hero.webp`.
3. Press **Save & publish** (shared backend) or **Copy JSON for the repo** and paste the values into
   `src/data/content.ts`.

Repo-relative paths are the portable choice: they resolve correctly on Vercel (`/`), on the GitHub
Pages project site (`/WZ-Ayush/`) and in the preview, because they are prefixed with `BASE_URL`.

## A ZIP is not playable

Browsers cannot play a `.zip`. Use an MP4/WebM (`mode: "video"`) or export the archive as a
zero-padded still sequence (`mode: "sequence"`). The hero falls back to the built-in 3D scene if the
configured media fails to load.

## Current files

| File | Used by | Notes |
| --- | --- | --- |
| `hero-shadow.svg` | Hero grounding silhouette | Blurred, low opacity. Replaceable (Artwork → Hero silhouette). |
| `background.svg` | Atmosphere / backdrops / OG image | Wide atmospheric still. |
| `portrait.svg` | About section | Rim-lit figure, 4:5 crop. Replaceable. |
| `cta.svg` | Final CTA backdrop | Wide cinematic still. Replaceable. |
| `featured/*.svg` | Project previews | One per live project; also editable per card in **Projects**. |
| `gallery/*.svg` | Archive + lightbox | Mixed portrait/landscape. |
| `horizontal/*.svg` | Horizontal reel | Tall/wide art-direction stills. |
| `models/hero.glb` | Hero (optional) | Drop-in glTF character; auto-framed. See `models/README.md`. |
| `sequence/` | Hero (optional) | `000.webp`, `001.webp`, … for the scroll sequence. |
| `media/` | Hero (optional) | `hero.mp4` / `hero-poster.webp` for the video mode. |

## Images added at runtime

Images uploaded from `#/admin` → **Uploads** are stored in the browser (IndexedDB), not in this
folder. They render ahead of the built-in frames in the Archive gallery with a “New” badge. To ship
one permanently, save it here and point the gallery entry at it.
