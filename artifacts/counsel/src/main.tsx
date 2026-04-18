import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { configurePlausible } from "@szl-holdings/analytics";
import { initSentry, initWebVitals, initAnalytics } from "@szl-holdings/observability/react";
import { GraphQLProvider } from "@szl-holdings/graphql-client/provider";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "counsel.szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "counsel", tracesSampleRate: 0.2 });
initWebVitals("counsel", "/api/");
initAnalytics({ appSlug: "counsel" });

if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/counsel/sw.js", { scope: "/counsel/" }).catch((err) => {
      console.warn("[Counsel SW] Registration failed:", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Counsel Legal Matter Command" accentColor="#8b5cf6">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
