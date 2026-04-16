import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary appName="Command" accentColor="#6366f1">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
