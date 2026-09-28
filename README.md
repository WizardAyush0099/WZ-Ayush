# Ayush — Portfolio

A premium, cinematic, animation-heavy personal portfolio with a **real-time
WebGL hero**, a GSAP scroll sequence, and a Clerk-authenticated analytics
dashboard.

Featured work: **Study Hub** and its three flagship pages — **FitLife
Blueprint**, **Guitar Theory Lab** and the **E-book Store**.

> The original cinematic brief this design implements lives in
> `freebuff_itachi_website_prompt.txt`. All copy and projects are portfolio
> content — see `src/data/content.ts`.

## Stack

- **Vite + React + TypeScript**
- **three.js + @react-three/fiber** — the hero is a live 3D scene
- **GSAP + ScrollTrigger** — scroll-driven, scrubbed, reversible sequences
- **Lenis** — smooth scrolling wired into the GSAP ticker
- **Tailwind CSS** — theme tokens in `tailwind.config.js` + `src/index.css`
- **@clerk/clerk-react** — sign-in, sign-up, account menu, admin gating
- Canvas 2D particles (embers + crows, fog) and the Web Audio API for ambient sound

## Routes

The app is **hash routed**, so it works at a domain root, on GitHub Pages under
a sub-path, and in the Freebuff preview without any server rewrites.

| Route | What it is |
| --- | --- |
| `#/` | The public portfolio |
| `#/admin` | Clerk-protected dashboard: growth, logins, image management |

## Scripts

| Command | Purpose |
| --- | --- |
| `bun install` | install dependencies |
| `bun run dev` | dev server on `0.0.0.0` (Vite, port 5173 or `$PORT`) |
| `bun run build` | production build to `dist/` |
| `VITE_BASE=./ bun run build` | build for sub-path hosting (GitHub Pages) |
| `bun run typecheck` | `tsc -b --noEmit` |

## Authentication & the dashboard

Clerk is wired up but **inert until a key exists**, so the site never breaks
because of missing credentials.

### 1. Add the publishable key

Settings → **Environment** → add:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
```

This is a public value (it starts with `pk_`) and is safe to paste. The
**secret** key is never needed by this client-only build — do not add it here.

Sign in / sign up controls appear in the navbar as soon as the key is present.

### 2. Unlock the dashboard

`#/admin` accepts any Clerk user whose `publicMetadata.role` is `"admin"`
(set that in the Clerk dashboard), any email in `VITE_ADMIN_EMAILS`, or any
email in `adminAllowlist` (`src/data/content.ts`). Set one of them — otherwise
the dashboard shows a “no access” card.

```
VITE_ADMIN_EMAILS=you@example.com
```

### 3. (Optional) Share analytics across all visitors

Out of the box the dashboard reads tracking stored in **this browser**. To
aggregate **every** visitor, deploy the bundled serverless endpoint
(`api/analytics.py`) against a Postgres database:

1. Create a free [Neon](https://neon.tech) Postgres project and copy its
   connection string.
2. Add it as `DATABASE_URL` in **Settings → Environment** (sandbox) and with
   `freebuff-deploy env set '{"DATABASE_URL":"…"}'` (production). It is a
   secret — never put it in client code or prefix it with `VITE_`.

Production builds then post sessions and events to `/api/analytics`
themselves (override with `VITE_ANALYTICS_URL` if the endpoint lives
elsewhere). Until `DATABASE_URL` exists the endpoint answers `503`, the client
falls back to local storage, and the site keeps working untouched.

### What the dashboard shows

- **Growth** — unique visitors, sessions, pageviews, sign-ins, accounts,
  average session length, a 7/14/30-day bar chart, device / browser / region /
  referrer breakdowns and a live activity feed.
- **Logins** — aggregated accounts, an authentication event log, and a session
  table with device, OS, referrer and duration.
- **Images** — drag-and-drop uploads (resized in the browser, stored in
  IndexedDB) that appear first in the homepage Archive gallery with a “New”
  badge. Delete to restore the built-in artwork.

Data is **first-party** — no cookies and no third-party analytics. It is
stored in the browser by default, and in your own Postgres once `DATABASE_URL`
is set (see above). CSV export is available for taking the numbers elsewhere.
The read path is a single `getSnapshot()` in `src/lib/telemetry.ts` plus the
matching `GET /api/analytics` response shape, so the dashboard renders the same
derivations against either source.

## Structure

```
api/
  analytics.py          serverless analytics API (Postgres-backed)
  requirements.txt      its Python dependency
public/assets/          artwork + the optional 3D model slot
src/
  data/content.ts       ALL copy, nav, projects, gallery, admin allow-list
  lib/
    gsap.ts             GSAP + ScrollTrigger registration
    scroll.ts           Lenis singleton + scrollTo helpers
    router.ts           tiny hash router
    telemetry.ts        growth + login store (localStorage, useSyncExternalStore)
    imageStore.ts       IndexedDB image store with in-browser resizing
    auth.ts             Clerk config + admin authorisation
    hooks.ts            reduced-motion / pointer / device-tier hooks
    ambient.ts          procedural ambient drone (no audio files)
    fx.ts               crow-transition event bus
  components/
    Preloader.tsx       cinematic load sequence
    CustomCursor.tsx    interpolated cursor w/ VIEW / EXPLORE labels
    Navbar.tsx          fixed nav + animated mobile menu + auth controls
    SoundToggle.tsx     muted-by-default ambient toggle (pref remembered)
    auth/AuthLayer.tsx  Clerk provider, session tracker, nav controls, gate
    admin/              AdminApp, GrowthPanel, LoginsPanel, ImageManager
    fx/                 EmberCanvas, CrowCanvas, FogCanvas, Atmosphere
    hero/NinjaScene.tsx three.js / R3F hero scene (eye, crows, embers)
    hero/UchihaFigure.tsx procedural character — cloak, red clouds, eyes
    hero/Hero.tsx       layered parallax hero + scroll transition
    hero/Sharingan.tsx  vector Mangekyo — the no-WebGL fallback
    common/             Reveal primitives, Lightbox provider
    sections/           Story, FeaturedWork, HorizontalGallery, Capability,
                        About, Gallery, FinalCTA, Footer
```

## Customising

**Everything user-facing is in `src/data/content.ts`.** Copy, project entries
with their highlights and stack chips, gallery frames, the admin allow-list and
all asset paths live there — no component edits required.

**Artwork.** `public/assets/README.md` documents every file and how to swap in
your own. `public/assets/models/README.md` covers the drop-in 3D character.

## Motion, performance & accessibility

- Scroll timelines are **tied to progress** (`scrub`) and reverse when scrolling up.
- Animations use **transform/opacity/clip-path** only, for GPU-friendly work.
- The 3D scene scales with device tier (crow count, ember count, pixel ratio,
  shadow-free rendering) and has a **three-way fallback**: reduced-motion users,
  machines without WebGL, and renderer failures all get the vector Mangekyo.
  The GLB probe is a single `HEAD` request, so a missing model costs nothing.
- Particle counts scale with viewport width and device tier; canvases pause when
  the tab is hidden.
- `prefers-reduced-motion` is respected everywhere: smooth scroll, parallax,
  particles, crows, 3D and reveals are all disabled and content stays usable.
- Keyboard navigation works throughout; the lightbox supports `Esc` / arrows and
  traps focus; contrast, focus rings, semantic landmarks and alt text are in place.
- Sound is **muted by default**, starts only from a user gesture, and the
  preference is remembered in `localStorage`.
