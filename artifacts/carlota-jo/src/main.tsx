import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@workspace/shared-ui/error-boundary";
import { configurePlausible } from "@workspace/analytics";
import { initSentry, initWebVitals } from "@workspace/observability/react";
import { GraphQLProvider } from "@workspace/graphql-client/provider";
import App from "./App";
import "./i18n";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "carlotajo.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "carlota-jo", tracesSampleRate: 0.2 });
initWebVitals("carlota-jo", "/api/");

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Carlota Jo Consulting" accentColor="#8b7ac8">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
