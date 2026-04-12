import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { configurePlausible } from "@szl-holdings/analytics";
import { initSentry, initWebVitals } from "@szl-holdings/observability/react";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "forge.szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "forge", tracesSampleRate: 0.1 });
initWebVitals("forge", "/api/");

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Forge" accentColor="#3b6fe8">
    <App />
  </ErrorBoundary>,
);
