import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { initSentry } from "@szl-holdings/observability/react";
import App from "./App";
import "./index.css";

initSentry({ appSlug: "command", tracesSampleRate: 0.2 });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary appName="Command" accentColor="#6366f1">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
