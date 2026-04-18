import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { configurePlausible } from "@szl-holdings/analytics";
import { initSentry, initWebVitals, initAnalytics } from "@szl-holdings/observability/react";
import { GraphQLProvider } from "@szl-holdings/graphql-client/provider";
import App from "./App";
import "./i18n";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "szl-holdings", tracesSampleRate: 0.2 });
initWebVitals("szl-holdings", "/api/");
initAnalytics({ appSlug: "szl-holdings" });

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary appName="SZL Holdings" accentColor="#8b7ac8">
      <GraphQLProvider>
        <App />
      </GraphQLProvider>
    </ErrorBoundary>
  </HelmetProvider>,
);
