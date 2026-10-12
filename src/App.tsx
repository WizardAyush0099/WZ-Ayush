import { useEffect } from "react";
import { useHashRoute } from "./lib/router";
import { useUiSounds } from "./lib/sfx";
import { startSession } from "./lib/telemetry";
import PortfolioApp from "./PortfolioApp";
import BuilderApp from "./components/builder/BuilderApp";
import TemplatePage from "./components/templates/TemplatePage";
import { AdminGate } from "./components/auth/AuthLayer";
import AdminApp from "./components/admin/AdminApp";

/**
 * ============================================================================
 *  APP — route switch
 * ============================================================================
 *  "/"               → the public portfolio (WebGL hero, GSAP scroll sequence)
 *  "/builder"        → template library + the eight-step commission brief
 *  "/template/<id>"  → one concept rendered full size, on its own page
 *  "/admin"          → protected studio dashboard (orders, projects, media)
 *
 *  Everything is hash-routed so the same build works at the domain root, on
 *  GitHub Pages under a sub-path, and inside the Freebuff preview.
 * ============================================================================
 */
export default function App() {
  const route = useHashRoute();

  // One session per visit — feeds the growth dashboard.
  useEffect(() => {
    startSession();
  }, []);

  // Interface sounds for the whole app: one delegated listener pair, so every
  // button, link and route change already has a voice without any component
  // knowing sound exists. Silent unless the visitor switched sound on.
  useUiSounds();

  if (route.startsWith("/admin")) {
    return (
      <AdminGate>
        <AdminApp />
      </AdminGate>
    );
  }

  if (route.startsWith("/template/")) {
    const id = decodeURIComponent(route.slice("/template/".length));
    return <TemplatePage id={id} />;
  }

  if (route.startsWith("/builder")) {
    return <BuilderApp />;
  }

  return <PortfolioApp />;
}
