import { lazy, Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { navigatorConfig } from "@workspace/shared-ui/copilot-configs";
import ProjectsPage from "@/pages/projects-page";
import { AppCatalog } from "@/pages/app-catalog";
import { LiveDemos } from "@/pages/live-demos";
import { cn } from "@/lib/utils";

const SpectrumAnalytics = lazy(() => import("@/pages/spectrum-analytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppContent({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: "projects" | "catalog" | "demos") => void }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pt-3">
          {[
            { id: "projects" as const, label: "Projects" },
            { id: "catalog" as const, label: "App Catalog" },
            { id: "demos" as const, label: "Live Demos" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2",
                activeTab === tab.id
                  ? "text-primary border-primary bg-background"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
              )}>{tab.label}</button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "projects" && <ProjectsPage />}
        {activeTab === "catalog" && <AppCatalog />}
        {activeTab === "demos" && <LiveDemos />}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<"projects" | "catalog" | "demos">("projects");

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Switch>
          <Route path="/spectrum">
            <Suspense fallback={<PageLoader />}>
              <SpectrumAnalytics />
            </Suspense>
          </Route>
          <Route path="/">
            <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />
          </Route>
          <Route>
            <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />
          </Route>
        </Switch>
      </WouterRouter>
      <AgentCopilot config={navigatorConfig} />
    </QueryClientProvider>
  );
}

export default App;
