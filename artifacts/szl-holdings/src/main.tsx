import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import posthog from "posthog-js";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { configurePlausible } from "@szl-holdings/analytics";
import { initSentry } from "@szl-holdings/observability/react";
import { initWebVitals } from "@szl-holdings/observability/react";
import { GraphQLProvider } from "@szl-holdings/graphql-client/provider";
import App from "./App";
import "./i18n";
import "./index.css";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.debug();
    },
  });
}

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "szl-holdings", tracesSampleRate: 0.2 });
initWebVitals("szl-holdings", "/api/");

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary appName="SZL Holdings" accentColor="#8b7ac8">
      <GraphQLProvider>
        <App />
      </GraphQLProvider>
    </ErrorBoundary>
  </HelmetProvider>,
);
