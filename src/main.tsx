import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "lenis/dist/lenis.css";
import "./index.css";
import App from "./App";
import { AuthLayer } from "./components/auth/AuthLayer";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

createRoot(container).render(
  <StrictMode>
    {/* ClerkProvider lives here, inside the app root — never around <html>. */}
    <AuthLayer>
      <App />
    </AuthLayer>
  </StrictMode>,
);
