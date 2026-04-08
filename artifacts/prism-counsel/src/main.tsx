import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { AnalyticsProvider } from "@szl-holdings/shared-ui";
import { PrismCounselApp } from "./prism-counsel-app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary appName="Prism Counsel" accentColor="#c8a96e">
    <AnalyticsProvider appName="prism-counsel">
      <PrismCounselApp />
    </AnalyticsProvider>
  </ErrorBoundary>,
);
