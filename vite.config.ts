import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// NOTE: Freebuff requires HMR to remain disabled. Do not enable `server.hmr`.
export default defineConfig({
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
