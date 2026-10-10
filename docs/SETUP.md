# Setup, routes and operations

## Stack (unchanged)

Vite 6 + React 18 + TypeScript + Tailwind 3, GSAP/ScrollTrigger + Lenis for motion, three.js /
@react-three/fiber for the hero scene, Clerk for auth, and one Python serverless function
(`api/analytics.py`) for shared data. Nothing about the framework, auth or database was replaced.

## Routes

| Route | What it is | Access |
| --- | --- | --- |
| `#/` | Cinematic portfolio: hero, approach, featured work, live websites, reel, capability, about, archive, contact | public |
| `#/builder` | Template library (20 concepts, live palette switching) + the eight-step commission brief | public |
| `#/admin` | Studio dashboard: orders, projects, artwork, growth, logins, uploads | Clerk sign-in + admin allow-list |

Routing is hash-based on purpose: GitHub Pages cannot rewrite URLs, so `#/builder` and `#/admin`
resolve to `index.html` on every host, including refresh and deep links.

## Environment variables

Client (Settings → Environment; none of these are secrets):

| Key | Purpose |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_…`) — enables sign-in and the dashboard |
| `VITE_ADMIN_EMAILS` | Extra admin emails, comma separated (merged with `adminAllowlist`) |
| `VITE_WHATSAPP_NUMBER` | Overrides the WhatsApp number in `src/data/content.ts` |
| `VITE_ANALYTICS_URL` | Overrides the API endpoint (defaults to `/api/analytics` in production) |
| `VITE_BASE` | Asset base; the GitHub Pages workflow sets `./`. Do not set it elsewhere |

Server (the Python function):

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Without it the API answers 503 and the site falls back to local-only storage |
| `CLERK_ISSUER` | e.g. `https://your-app.clerk.accounts.dev`. Enables JWT signature verification |
| `CLERK_JWKS_URL` | Optional explicit JWKS override |
| `ADMIN_USER_IDS` | **Recommended.** Clerk user ids allowed to read client data / publish content |
| `ADMIN_EMAILS` | Emails allowed the same (needs an `email` claim on the session token) |

Where to find your Clerk user id: sign in, open `#/admin` — the **Backend access** panel prints it.

### Manual steps that cannot be automated

1. **Clerk key** — Settings → Environment → `VITE_CLERK_PUBLISHABLE_KEY` = your `pk_…` key.
2. **Server authorization** — set `CLERK_ISSUER` and `ADMIN_USER_IDS` (or `ADMIN_EMAILS`) on the
   hosting environment, then redeploy. Until then the API returns public content only and refuses
   every privileged read and write — deliberately, so client data is never exposed by default.
3. **Database** — set `DATABASE_URL` so briefs and site content are shared across visitors.
   Tables are created automatically on first use (`wz_sessions`, `wz_events`, `wz_orders`, `wz_site`).
4. **Artwork** — follow `docs/ASSET_WORKFLOW.md`.

## Quick reference: the commands this repo actually uses

```bash
bun install            # install
bun run typecheck      # tsc -b --noEmit
bun run build          # vite build  → dist/
bun run dev            # local dev server
```

## Where things live

```
src/data/content.ts          copy, projects, 20 templates, the builder model, contact details
src/lib/theme.ts             the 10 palettes + live switching
src/lib/siteData.ts          admin-editable artwork paths, scroll media, project cards
src/lib/orders.ts            commission briefs (local + shared)
src/lib/apiAuth.tsx          Clerk session token bridge for authenticated API calls
src/lib/telemetry.ts         first-party analytics
src/components/builder/      the /#/builder experience
src/components/admin/        the dashboard panels
src/components/media/        video / image-sequence / 3D hero media
api/analytics.py             the serverless API (auth, storage, public/admin split)
```

Static SEO files: `public/robots.txt`, `public/sitemap.xml`, metadata and JSON-LD in `index.html`.
