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
├── gallery/               archive frames
├── horizontal/            the pinned reel
├── hero-sequence/         the shipped hero run — 000.jpg … 299.jpg
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

## 3. The cinematic scroll media

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
hero already ships with one**: the 300-frame render from `Images.zip`, extracted to
`public/assets/hero-sequence/` as `000.jpg` … `299.jpg` and wired up in `mediaDefaults`
(`src/data/content.ts`). Scrolling the hero advances the frames; scrolling back reverses them.

To swap in your own run:

1. Rename frames to three digits: `000.webp`, `001.webp`, … `119.webp`.
2. Upload them to `public/assets/sequence/` (leave `hero-sequence/` alone unless you are replacing
the built-in render).
3. Set `Frame folder` = `assets/sequence`, `Frame count` = `120`, `Extension` = `webp`.
4. Optionally set `Scroll length` (default `360vh`) — how much scrolling plays the sequence.

Frames stream in progressively — the opening frame first, then a coarse ladder, then the rest — so
scrubbing is usable immediately and nothing is ever a blank frame. Up to 420 frames are used.

---

## 4. Making a change permanent (no backend required)

Without a configured backend, dashboard changes live in **that browser only** and the committed
files stay the source of truth for visitors. To make a change permanent for everyone:

1. **Artwork** → **Copy JSON for the repo**.
2. Paste the values over `assetDefaults` / `mediaDefaults` in `src/data/content.ts`
   (and `projects` for project cards).
3. Commit and push.

With a shared backend configured, **Save & publish** writes the same document server-side and every
visitor picks it up on their next page load — no commit needed.

---

## 5. Base paths, in one place

| Host | `VITE_BASE` | Consequence |
| --- | --- | --- |
| Vercel / custom domain | `/` (default) | assets at `/assets/…` |
| GitHub Pages project site | `./` (set by the workflow) | assets resolve relative to `/WZ-Ayush/` |
| Freebuff preview | `/` | assets at `/assets/…` |

Because routing is hash-based (`#/builder`, `#/admin`), deep links never 404 on static hosting, and
because asset paths are normalised through `BASE_URL`, one build is correct on all three.

---

## 6. Checklist before you publish artwork

- [ ] File is under `public/assets/` (or a full URL) and the path resolves in the dashboard preview.
- [ ] Images are WebP/JPEG, compressed, and no wider than ~2400px.
- [ ] Sequences are zero-padded to three digits and the count matches what you uploaded.
- [ ] Videos are MP4/WebM, muted-safe, and short.
- [ ] You pressed **Save & publish** (or copied the JSON into `src/data/content.ts`).
