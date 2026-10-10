import { useEffect } from "react";
import { useHashRoute } from "./lib/router";
import { startSession } from "./lib/telemetry";
import PortfolioApp from "./PortfolioApp";
import BuilderApp from "./components/builder/BuilderApp";
import { AdminGate } from "./components/auth/AuthLayer";
import AdminApp from "./components/admin/AdminApp";

/**
 * ============================================================================
 *  APP — route switch
 * ============================================================================
 *  "/"         → the public portfolio (WebGL hero, GSAP scroll sequence)
 *  "/builder"  → template library + the eight-step commission brief
 *  "/admin"    → Clerk-protected studio dashboard (orders, projects, media)
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

  if (route.startsWith("/admin")) {
    return (
      <AdminGate>
        <AdminApp />
      </AdminGate>
    );
  }

  if (route.startsWith("/builder")) {
    return <BuilderApp />;
  }

  return <PortfolioApp />;
}
