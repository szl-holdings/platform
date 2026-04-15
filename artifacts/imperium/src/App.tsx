import React, { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImperiumLayout } from "@/components/imperium-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "rgba(201,162,39,0.2)", borderTopColor: "#c9a227" }}
        />
        <p className="font-display text-xs tracking-widest text-gold-dim uppercase">
          Consulting the Augurs...
        </p>
      </div>
    </div>
  );
}

const LegatusConsole = lazy(() => import("@/pages/legatus-console"));
const ImperiumMap = lazy(() => import("@/pages/imperium-map"));
const PraetorianGuard = lazy(() => import("@/pages/praetorian-guard"));
const SenateChamber = lazy(() => import("@/pages/senate-chamber"));
const SupplyLines = lazy(() => import("@/pages/supply-lines"));
const CenturionAI = lazy(() => import("@/pages/centurion-ai"));
const IntelligenceBriefing = lazy(() => import("@/pages/intelligence-briefing"));

const base = (import.meta.env.BASE_URL || "/imperium/").replace(/\/$/, "");

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={base}>
        <ImperiumLayout>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={LegatusConsole} />
              <Route path="/legatus" component={LegatusConsole} />
              <Route path="/imperium-map" component={ImperiumMap} />
              <Route path="/praetorian" component={PraetorianGuard} />
              <Route path="/senate" component={SenateChamber} />
              <Route path="/supply-lines" component={SupplyLines} />
              <Route path="/centurion" component={CenturionAI} />
              <Route path="/intelligence" component={IntelligenceBriefing} />
              <Route>
                <div className="flex items-center justify-center h-64 text-slate-400 text-sm font-display tracking-widest">
                  PAGE NOT FOUND — RETURN TO IMPERIUM
                </div>
              </Route>
            </Switch>
          </Suspense>
        </ImperiumLayout>
      </WouterRouter>
    </QueryClientProvider>
  );
}
