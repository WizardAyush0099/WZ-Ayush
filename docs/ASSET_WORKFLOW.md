# Asset & scroll-media workflow

Everything visual on this site is replaceable without touching a component. There are two ways to
change artwork, and one important rule about video.

---

## The rule: a ZIP is not playable

A `.zip` is an archive, not a video. No browser will ever play one from an `<img>` or `<video>` tag.
If you download a "ZIP of frames" from an AI tool, you have **frames**, not a movie. This project
therefore supports exactly two moving-image formats, and a ZIP is never an option:

| What you have | What to do | Config value |
| --- | --- | --- |
| A `.mp4` / `.webm` | Upload as-is | `mode: "video"` |
| A ZIP (or folder) of numbered stills | Unzip, renumber to `000`, `001`, … and upload the folder | `mode: "sequence"` (**the shipped default**) |
| Nothing yet | Use the built-in 3D scene | `mode: "scene"` |

Whichever you choose, the hero falls back to the procedural 3D scene if the files fail to load, so a
typo in a path can never leave a black rectangle on the page.

---

## 1. Upload the file

Put artwork in the repository under `public/assets/`:

```
public/assets/
├── hero-shadow.svg        hero silhouette
├── background.svg         wide atmospheric backdrop
├── portrait.svg           about-section portrait
├── cta.svg                final CTA backdrop
├── featured/              project previews
├── archive/               the Archive's three big frames (WebP stills)
├── hero-sequence/         the shipped hero run — 000.jpg … 420.jpg
├── sequence/              (optional) 000.webp, 001.webp, …
└── media/                 (optional) hero.mp4 / hero-poster.webp
```

Anything in `public/` is served from the site root at build time, so `public/assets/hero.webp`
becomes `/assets/hero.webp`.

**Sizes that behave well:** JPEG/WebP at quality ~80, longest edge ≤ 2400px, under ~400 KB each.
For a sequence, 120–180 frames at 1600×900 and 70–80 quality is the sweet spot.

## 2. Paste the path into the dashboard

Open `#/admin` → **Artwork**. Every field accepts all three of these shapes, and normalises them
for you:

| You paste | Result | When to use it |
| --- | --- | --- |
| `assets/hero.webp` | `BASE_URL + assets/hero.webp` | **Preferred.** Works on Vercel, GitHub Pages and local dev. |
| `/WZ-Ayush/assets/hero.webp` | used as-is | Absolute path, needed if a host serves from a fixed sub-path. |
| `https://cdn.example.com/hero.webp` | used as-is | External file (CDN, image host). |

`BASE_URL` is `/` on Vercel and `./` in the GitHub Pages workflow, which is exactly why the first
form is the safe one — the same value is correct on both hosts.

Then press **Save** (this browser) or **Save & publish** (every visitor, requires the backend).

### Frames are addressed from `000`

Every sequence loader on this site — the hero's and the image slots' — reads `folder/000.jpg`,
`001.jpg`, … zero-padded to three digits. A folder that starts at `001` is addressed one frame out:
`000` is missing, the first frame fails, and the run never starts (the tile simply shows its poster,
or nothing if it has none).

## 3. The Images tab — every picture, section by section

`#/admin` → **Images** is the section-wise manager. Each section of the page owns nine numbered
slots, and every frame the site draws is one of them:

| Section | Slots | Where they render |
| --- | --- | --- |
| **Hero** | 01–09 | Slot 01 is the defocused plane behind the opening film (path, blur, opacity). |
| **Studio** | 01–09 | Slot 01 is the picture beside “How I Work”. It starts **empty** on purpose — the band sits directly under the hero's film, so with nothing set the copy takes the full width instead of leaving a hole. |
| **The Archive** | 01–09 | 01–03 the three wide stills; 04–09 the tiles below them, empty until you fill them. |
| **Featured work** | 01–09 | Slot 01 styles the first live project card, slot 02 the second, and so on. |

**To add or replace a picture:** upload the file to `public/assets/` on GitHub, copy its path
(`assets/archive/hero.webp`), paste it into the slot's *Image path* field, and press **Publish**.
Paths are normalised exactly like the Artwork tab, so all three shapes work.

**To make a slot play a scroll animation instead of a still:** press **Make this slot a film**, then
set the frame folder (`assets/sequence`), the frame count, the extension and the two window
sliders. A film is scrubbed by the frame's own travel through the viewport — the same mechanic as
the hero's opening reel — so the picture moves as the visitor scrolls, with no video file at all.
*Plays from* / *Plays to* (0 → 1) pick which passage of the run that slot shows, which is how
several tiles can show several moments of one run without loading it several times.

Nothing ships as a film: a fresh film slot points at `assets/sequence`, which does not exist until
you upload a run there. Give the slot an *Image path* as well and that still is the poster it shows
while the frames stream in.

**Every slot also carries its own properties**, and each one is applied by the frame itself:

| Property | What it does |
| --- | --- |
| Animation | `film` (scrub only), `reveal` (mask + blur-to-sharp), `parallax` (drift), `zoom` (push-in), `fade`, `still`. |
| Opacity | How strongly the picture is drawn (0.1 → 1). |
| Blur background | A soft, blurred copy of the same picture behind the frame (0 → 24 px). |
| Width / Height | The frame's size: a percentage of its column, and an optional pixel height (0 keeps the section's own aspect). |
| Background | The colour painted behind the frame. |
| On / Off | A slot that is off renders nothing at all. |

Edits apply to the page immediately, so the preview inside each slot card is the real thing. Press
**Publish for every visitor** to send the document to the shared backend (see §5).

## 4. The cinematic scroll media

Also on the **Artwork** tab, under *Cinematic scroll media*:

### `scene` — the procedural fallback
A live WebGL scene generated at runtime: a Mangekyo eye, a crow swarm, an ember field. No files, no
network, nothing to break. Works on mid-range phones.

### `video` — one looping clip
- `Video file` → `assets/media/hero.mp4` (H.264 MP4, or WebM for smaller files; ~3–6 MB, ≤ 12s).
- `Poster image` → a still shown before playback.

The clip autoplays **muted** and loops, which is the only autoplay every browser allows.

### `sequence` — scrubbed by scroll (the shipped hero)
The most cinematic option, and the cheapest to run, because each frame is a small still. **The
hero already ships with one**: the 413 frames from `scene1.zip` and `scene2.zip` — 209 then 204,
scene 1 into scene 2 — merged into a single run and extracted to
`public/assets/hero-sequence/` as `000.jpg` … `420.jpg`, wired up in `mediaDefaults`
(`src/data/content.ts`). Scrolling the hero advances the frames; scrolling back reverses them.

The two archives were separate takes, not one continuous camera move, so their junction was a hard
jump. Frames `209` … `216` are eight generated cross-dissolve stills that carry scene 1 into
scene 2; every frame from the archives is otherwise byte-identical, at its original 1920x1080.

To swap in your own run:

1. Rename frames to three digits: `000.webp`, `001.webp`, … `119.webp`.
2. Upload them to `public/assets/sequence/` (leave `hero-sequence/` alone unless you are replacing
the built-in render).
3. Set `Frame folder` = `assets/sequence`, `Frame count` = `120`, `Extension` = `webp`.
4. Optionally set `Scroll length` (default `480vh`) — how much scrolling plays the sequence.

Frames stream in progressively — the opening frame first, then a coarse ladder, then the rest — so
scrubbing is usable immediately and nothing is ever a blank frame. Up to 600 frames are used.

**A grid of films loads one run, once.** The Archive's six tiles used to play six passages of a
separate 240-frame render; that render has been removed (at tile size it read as a dark smudge), so
the tiles now wait for your own pictures. Point several slots at the *same* folder and they share
one copy of every decoded frame — `acquireRun` in `src/components/media/frameRun.ts` keeps one run
per folder, count and extension — so a grid of moving pictures does not cost a grid of downloads.

---

## 5. Making a change permanent (no backend required)

Without a configured backend, dashboard changes live in **that browser only** and the committed
files stay the source of truth for visitors. To make a change permanent for everyone:

1. **Images**, **Artwork** or **Studio** → **Copy JSON for the repo** (on the Studio tab it is
   **Document → Copy the document**).
2. Paste the values over `assetDefaults` / `mediaDefaults` in `src/data/content.ts`,
   `projects` for project cards, `imageSlotDefaults` in `src/data/imageSlots.ts`, and
   `studioDefaults` in `src/data/studioDefaults.ts`.
3. Commit and push.

With a shared backend configured, **Save & publish** writes the same document server-side and every
visitor picks it up on their next page load — no commit needed.

---

## 6. Base paths, in one place

| Host | `VITE_BASE` | Consequence |
| --- | --- | --- |
| Vercel / custom domain | `/` (default) | assets at `/assets/…` |
| GitHub Pages project site | `./` (set by the workflow) | assets resolve relative to `/WZ-Ayush/` |
| Freebuff preview | `/` | assets at `/assets/…` |

Because routing is hash-based (`#/builder`, `#/admin`), deep links never 404 on static hosting, and
because asset paths are normalised through `BASE_URL`, one build is correct on all three.

---

## 7. Checklist before you publish artwork

- [ ] File is under `public/assets/` (or a full URL) and the path resolves in the dashboard preview.
- [ ] Images are WebP/JPEG, compressed, and no wider than ~2400px.
- [ ] Sequences are zero-padded to three digits **starting at `000`**, and the count matches
      what you uploaded.
- [ ] Videos are MP4/WebM, muted-safe, and short.
- [ ] You pressed **Save & publish** (or copied the JSON into `src/data/content.ts`).

---

## 8. The Studio tab — any point, any 3D run

`#/admin` → **Studio** is the visual editor. It shows the real homepage in a frame and works on
**points**: anything on the page that carries a `data-tune` attribute — every section, every row and
heading inside them, every picture in the Images tab, and every 3D run you add.

How it works, in one breath: **hover the frame to outline a point, tap it to select it**, then drag
the sliders on the right. The frame is not a mock-up — it is the same site reading the same
document — so it changes as you drag, and the pointer is a crosshair while pick mode is on.

The sub-tabs:

| Tab | What it edits |
| --- | --- |
| **Points** | Crop/enlarge (`zoom`, crop across, crop down), size, width, height, nudge, tilt, opacity, blur, corner radius, stacking, and an on/off switch per point. |
| **3D runs** | The hero's own run, and any number of additional runs (below). |
| **Motion** | The hero's run length, scrub, dolly, stage size and parallax; the mark's spin; the pinned shelf's scrub and reveal; and a global run-speed trim. |
| **Effects** | Film grain, vignette, embers, hero haze, custom cursor, opening counter, scroll-wound mark, sound, smooth scrolling. |
| **Layout** | The order of the page's sections, and which are hidden. A hidden section renders nothing at all. |
| **Document** | Copy the whole document, paste one back, restore the committed defaults. |

Two rules keep the page from tearing, and both are enforced rather than documented-only: the two
**pinned** bands (the hero and the templates shelf) refuse scale, tilt and nudge, because a
transform on an ancestor turns the pin's `position: fixed` into a lie; and a point left at its
defaults writes **no CSS at all**, so the committed design is exactly what an untouched document
renders.

### 3D runs — a folder of frames, placed anywhere

A “stage” is a scroll-scrubbed run played at a point you choose. It is the hero's own mechanic,
reused: the same renderer, the same frame streaming, the same zero-padded addressing.

**A `.zip` is still never read at runtime** (see the rule at the top of this file). The route is:

1. Export the animation as stills and **extract the archive into the repository**, e.g.
   `public/assets/sequence-2/` → `000.jpg`, `001.jpg`, … A folder of 400–600 frames is fine; each
   frame is a small still and only the ones near the playhead are ever decoded.
2. `#/admin` → **Studio** → **3D runs** → **Add a 3D run** (or start from a preset).
3. Set **Frame folder** (`assets/sequence-2`), **Frames** (`480`), **Extension** (`jpg`), and
   optionally a **Poster** (leave it empty to use frame `000`).
4. Choose **Plays in** (which section) and **Position** (before or after it).
5. Shape it: **Width** as a percentage of the page, **Height** in pixels or one of the aspect
   ratios, corner radius, opacity and the floor under the captions.
6. Pace it: **Plays from / to** pick the passage, **Scroll it takes** is how many screens of
   scrolling the run spans, **Speed** multiplies that (2 = half the scroll), **Ease** bends the
   curve, and **Ping-pong** reverses at the end instead of cutting back. Switch **Driven by** to
   *Itself* and the run plays at a frame rate instead of following the scroll.

A stage renders as a real band of the page — normal flow, your palette, no iframe — and carries a
small readout of which frame of how many is showing, which is the quickest way to tell a run that
is playing from one that is not. **Restore committed defaults** on the Document sub-tab puts
everything back.

### Pictures vs. everything else

A picture point edits its **slot** (the Images tab's document) rather than painting CSS over it, so
its crop, size, opacity, film and animation have exactly one home. Every other point edits a **box**
in the studio document. Both are stored in the same published payload, so one press of **Publish for
every visitor** carries the lot.
