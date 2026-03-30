import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { terraConfig } from "@workspace/shared-ui/copilot-configs";
import { Sidebar } from "@/components/sidebar";

const HomePage = lazy(() => import("@/pages/home"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const MarketPage = lazy(() => import("@/pages/market"));
const PipelinePage = lazy(() => import("@/pages/pipeline"));
const PropertyDetailPage = lazy(() => import("@/pages/property-detail"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const AlertsPage = lazy(() => import("@/pages/alerts-page"));
const InvestmentAnalysis = lazy(() => import("@/pages/investment-analysis"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/market" component={MarketPage} />
        <Route path="/pipeline" component={PipelinePage} />
        <Route path="/property/:id" component={PropertyDetailPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/investment-analysis" component={InvestmentAnalysis} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-terra-text-secondary">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="flex h-screen bg-terra-bg">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </WouterRouter>
      <AgentCopilot config={terraConfig} />
    </>
  );
}

export default App;
