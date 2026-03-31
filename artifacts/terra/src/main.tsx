import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@workspace/shared-ui/error-boundary";
import { configurePlausible } from "@workspace/analytics";
import { initWebVitals } from "@workspace/observability/react";
import { GraphQLProvider } from "@workspace/graphql-client/provider";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "beacon.szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initWebVitals("terra", "/api/");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary appName="Terra Real Estate Intelligence">
      <GraphQLProvider>
        <App />
      </GraphQLProvider>
    </ErrorBoundary>
  </StrictMode>,
);
