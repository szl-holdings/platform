import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const Matters = lazy(() => import("@/pages/Matters"));
const Assets = lazy(() => import("@/pages/Assets"));
const Documents = lazy(() => import("@/pages/Documents"));
const Messages = lazy(() => import("@/pages/Messages"));
const Settings = lazy(() => import("@/pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
      retry: 1,
    },
  },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "") || "/forge";

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div
        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--color-forge-primary)" }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE}>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={() => <Redirect to="/dashboard" />} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/matters" component={Matters} />
            <Route path="/assets" component={Assets} />
            <Route path="/documents" component={Documents} />
            <Route path="/messages" component={Messages} />
            <Route path="/settings" component={Settings} />
            <Route component={() => <Redirect to="/dashboard" />} />
          </Switch>
        </Suspense>
      </WouterRouter>
    </QueryClientProvider>
  );
}
