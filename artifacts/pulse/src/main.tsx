import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initSentry, initAnalytics } from "@szl-holdings/observability/react";
import App from "./App";
import "./index.css";

initSentry({ appSlug: "pulse", tracesSampleRate: 0.1 });
initAnalytics({ appSlug: "pulse" });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
