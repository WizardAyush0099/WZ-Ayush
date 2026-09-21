import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `VITE_BASE` lets a sub-path host (e.g. GitHub Pages project sites) build with
// relative asset URLs. Defaults to "/" for root hosting (Vercel, preview).
// NOTE: Freebuff requires HMR to remain disabled. Do not enable `server.hmr`.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
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
