import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { configurePlausible } from "@szl-holdings/analytics";
import { initSentry, initWebVitals, initAnalytics } from "@szl-holdings/observability/react";
import { GraphQLProvider } from "@szl-holdings/graphql-client/provider";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "beacon.szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "terra", tracesSampleRate: 0.2 });
initWebVitals("terra", "/api/");
initAnalytics({ appSlug: "terra" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary appName="Terra Real Estate Intelligence" accentColor="#d4a054">
      <GraphQLProvider>
        <App />
      </GraphQLProvider>
    </ErrorBoundary>
  </StrictMode>,
);
