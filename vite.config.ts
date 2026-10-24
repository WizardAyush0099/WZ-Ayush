import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// `VITE_BASE` lets a sub-path host (e.g. GitHub Pages project sites) build with
// relative asset URLs. Defaults to "/" for root hosting (Vercel, preview).
// NOTE: Freebuff requires HMR to remain disabled. Do not enable `server.hmr`.

/**
 * Vite only exposes `VITE_`-prefixed variables to the client, but Clerk's own
 * documentation and dashboard label this value `CLERK_PUBLISHABLE_KEY` (and
 * Next.js apps use `NEXT_PUBLIC_…`). Without an alias a host that set Clerk's
 * name builds a site with no key at all — auth silently never configures.
 *
 * Only the PUBLISHABLE key is mapped, and it is public by design (`pk_…`).
 * The secret key is deliberately never read here, and nothing is put in
 * `envPrefix`, which would leak every non-public variable into the bundle.
 */
const clerkPublishableKeyAlias =
  process.env.VITE_CLERK_PUBLISHABLE_KEY ??
  process.env.CLERK_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ??
  "";

/**
 * The template shelf lives in `Templates/` at the repository root, not in
 * `public/`, so the repo reads as one shelf of complete sites instead of a
 * folder buried in the build plumbing. Vite only serves `public/`, so this
 * plugin mounts the shelf at `/templates/` in dev and emits it to
 * `dist/templates/` on build — the URLs every card, iframe and route already
 * uses, with the files still readable and editable where they are.
 */
function templateShelf(): Plugin {
  const dir = path.resolve(process.cwd(), "Templates");
  const mount = "templates";
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };

  const files = () =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((name) => !name.startsWith(".") && fs.statSync(path.join(dir, name)).isFile())
      : [];

  return {
    name: "template-shelf",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        const prefix = `/${mount}/`;
        if (!url.startsWith(prefix)) return next();
        const name = decodeURIComponent(url.slice(prefix.length));
        // Flat names only: the shelf is one folder, never a path traversal.
        if (!name || name.includes("/") || name.startsWith(".")) return next();
        const file = path.join(dir, name);
        if (!fs.existsSync(file)) return next();
        res.setHeader("Content-Type", types[path.extname(name).toLowerCase()] ?? "application/octet-stream");
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(file).pipe(res);
      });
    },
    generateBundle() {
      for (const name of files()) {
        this.emitFile({
          type: "asset",
          fileName: `${mount}/${name}`,
          source: fs.readFileSync(path.join(dir, name)),
        });
      }
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  define: {
    __CLERK_PUBLISHABLE_KEY__: JSON.stringify(clerkPublishableKeyAlias),
  },
  plugins: [react(), templateShelf()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    hmr: false,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
    allowedHosts: true,
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
  },
});
