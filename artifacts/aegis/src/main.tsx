import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { configurePlausible } from "@szl-holdings/analytics";
import { initSentry, initWebVitals } from "@szl-holdings/observability/react";
import { GraphQLProvider } from "@szl-holdings/graphql-client/provider";
import App from "./App";
import "./index.css";

configurePlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || "aegis.szlholdings.com",
  debugMode: import.meta.env.DEV,
  trackLocalhost: false,
});

initSentry({ appSlug: "aegis", tracesSampleRate: 0.2 });
initWebVitals("aegis", "/api/");

if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/aegis/sw.js", { scope: "/aegis/" }).catch((err) => {
      console.warn("[Aegis SW] Registration failed:", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Aegis" accentColor="#c45a4a">
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </ErrorBoundary>,
);
