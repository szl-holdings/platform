import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { navigatorConfig } from "@workspace/shared-ui/copilot-configs";
import ProjectsPage from "@/pages/projects-page";
import { AppCatalog } from "@/pages/app-catalog";
import { LiveDemos } from "@/pages/live-demos";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState<"projects" | "catalog" | "demos">("projects");

  return (
    <QueryClientProvider client={queryClient}>
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
      <AgentCopilot config={navigatorConfig} />
    </QueryClientProvider>
  );
}

export default App;
