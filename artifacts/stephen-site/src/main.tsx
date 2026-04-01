import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@workspace/shared-ui/error-boundary";
import { configurePlausible } from "@workspace/analytics";
import { initSentry, initWebVitals } from "@workspace/observability/react";
import { GraphQLProvider } from "@workspace/graphql-client/provider";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "stephenlutar.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "stephen-site", tracesSampleRate: 0.2 });
initWebVitals("stephen-site", "/api/");

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Stephen Lutar" accentColor="#8b7ac8">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
