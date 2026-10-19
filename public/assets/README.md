# Assets

All artwork the site renders lives here. Everything is original work produced for this project, so
it is safe to ship as-is — and all of it is replaceable from the dashboard without touching code.

**Full instructions: [`docs/ASSET_WORKFLOW.md`](../../docs/ASSET_WORKFLOW.md)** — how to upload,
which path formats work on Vercel vs GitHub Pages, and how to set up video or a scroll-scrubbed
image sequence.

## Quick version

1. Drop your file in this folder (or a subfolder), e.g. `public/assets/hero.webp`. For an
   animation, extract the archive here as a numbered folder: `public/assets/sequence-2/000.jpg`, …
2. Open `#/admin` → **Images** (every picture, section by section), **Artwork** (the four global
   stills) or **Studio → 3D runs** (a folder of frames played at any point) and paste the
   **repo-relative** path: `assets/hero.webp`.
3. Press **Publish for every visitor** (shared backend) or **Copy JSON for the repo** and paste the
   values into `src/data/imageSlots.ts` / `src/data/content.ts` / `src/data/studioDefaults.ts`.

Repo-relative paths are the portable choice: they resolve correctly on Vercel (`/`), on the GitHub
Pages project site (`/WZ-Ayush/`) and in the preview, because they are prefixed with `BASE_URL`.

## A ZIP is not playable

Browsers cannot play a `.zip`. Use an MP4/WebM (`mode: "video"`) or export the archive as a
zero-padded still sequence (`mode: "sequence"`). The hero falls back to the built-in 3D scene if the
configured media fails to load.

## Current files

| File | Used by | Notes |
| --- | --- | --- |
| `hero-shadow.svg` | Hero grounding silhouette | Blurred, low opacity. Image slot `hero-01` (path, blur, opacity) or Artwork → Hero silhouette. |
| `background.svg` | Atmosphere / backdrops / OG image | Wide atmospheric still. |
| `portrait.svg` | About section | Rim-lit figure, 4:5 crop. Replaceable. |
| `cta.svg` | Final CTA backdrop | Wide cinematic still. Replaceable. |
| `featured/*.svg` | Project previews | One per live project; also editable per card in **Projects**, or per slot in **Images** → Featured work. |
| `archive/*.webp` | The Archive's three big frames | The stills from the repo's `Archive Images` folder, optimised to WebP (1672x941). Image slots `archive-01` … `archive-03`. |
| `sequence/` | Slots and 3D runs (optional) | A run you upload: `000.webp`, `001.webp`, … Point a slot at it (Images tab) and the frame plays it as a scroll film, or point a **Studio → 3D runs** stage at it to play it at any point of the page. |
| `gallery/`, `horizontal/` | *unused* | The old flat placeholder vectors. Nothing references them any more — the Archive's grid is image slots now. Safe to delete. |
| `hero-sequence/000.jpg … 420.jpg` | Hero scroll sequence | The scene1 + scene2 merge (421 frames, scene 1 cross-dissolved into scene 2 at the seam). Original 1920x1080 stills. |
| `models/hero.glb` | Hero (optional) | Drop-in glTF character; auto-framed. See `models/README.md`. |
| `media/` | Hero (optional) | `hero.mp4` / `hero-poster.webp` for the video mode. |

## Images added at runtime

Images uploaded from `#/admin` → **Images** → *Quick add from this device* are stored in the browser
(IndexedDB), not in this folder. They render ahead of the Archive's tiles with a “New” badge. To
reach every visitor, save the file here and point an image slot at it instead.
