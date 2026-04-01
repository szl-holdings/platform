import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@workspace/shared-ui/error-boundary";
import { configurePlausible } from "@workspace/analytics";
import { initSentry } from "@workspace/observability/react";
import { initWebVitals } from "@workspace/observability/react";
import { GraphQLProvider } from "@workspace/graphql-client/provider";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "szl-holdings", tracesSampleRate: 0.2 });
initWebVitals("szl-holdings", "/api/");

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="SZL Holdings" accentColor="#8b7ac8">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
