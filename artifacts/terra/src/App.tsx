import { Switch, Route, Router as WouterRouter } from "wouter";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { terraConfig } from "@workspace/shared-ui/copilot-configs";
import { Sidebar } from "@/components/sidebar";
import HomePage from "@/pages/home";
import DashboardPage from "@/pages/dashboard";
import MarketPage from "@/pages/market";
import PipelinePage from "@/pages/pipeline";
import PropertyDetailPage from "@/pages/property-detail";
import AnalyticsPage from "@/pages/analytics";
import AlertsPage from "@/pages/alerts-page";
import InvestmentAnalysis from "@/pages/investment-analysis";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/market" component={MarketPage} />
      <Route path="/pipeline" component={PipelinePage} />
      <Route path="/property/:id" component={PropertyDetailPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/investment-analysis" component={InvestmentAnalysis} />
      <Route>
        <div className="flex items-center justify-center h-full">
          <p className="text-terra-text-secondary">Page not found</p>
        </div>
      </Route>
    </Switch>
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
