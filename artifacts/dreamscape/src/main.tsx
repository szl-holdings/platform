import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@workspace/shared-ui/error-boundary";
import { configurePlausible } from "@workspace/analytics";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "nimbus.szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Dreamscape Creative Engine">
    <App />
  </ErrorBoundary>,
);
