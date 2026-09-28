import { useEffect } from "react";
import { useHashRoute } from "./lib/router";
import { startSession } from "./lib/telemetry";
import PortfolioApp from "./PortfolioApp";
import { AdminGate } from "./components/auth/AuthLayer";
import AdminApp from "./components/admin/AdminApp";

/**
 * ============================================================================
 *  APP — route switch
 * ============================================================================
 *  "/"       → the public portfolio (WebGL hero, GSAP scroll sequence)
 *  "/admin"  → Clerk-protected growth, login and image dashboard
 *
 *  Everything is hash-routed so the same build works at the domain root, on
 *  GitHub Pages under a sub-path, and inside the Freebuff preview.
 * ============================================================================
 */
export default function App() {
  const route = useHashRoute();
  const isAdmin = route.startsWith("/admin");

  // One session per visit — feeds the growth dashboard.
  useEffect(() => {
    startSession();
  }, []);

  if (isAdmin) {
    return (
      <AdminGate>
        <AdminApp />
      </AdminGate>
    );
  }

  return <PortfolioApp />;
}
