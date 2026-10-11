import { defineConfig } from "vite";
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

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  define: {
    __CLERK_PUBLISHABLE_KEY__: JSON.stringify(clerkPublishableKeyAlias),
  },
  plugins: [react()],
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
