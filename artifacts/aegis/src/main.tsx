import { createRoot } from "react-dom/client";
import { initSentry } from "@szl-holdings/observability/react";
import App from "./App";
import "./index.css";

initSentry({ appSlug: "aegis", tracesSampleRate: 0.1 });

createRoot(document.getElementById("root")!).render(<App />);
