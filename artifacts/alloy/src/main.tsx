import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@workspace/shared-ui/error-boundary";
import { configurePlausible } from "@workspace/analytics";
import { initWebVitals } from "@workspace/observability/react";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "alloyscape.io",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initWebVitals("alloy", `${import.meta.env.BASE_URL || "/alloy/"}api/`);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Alloy">
    <App />
  </ErrorBoundary>,
);
