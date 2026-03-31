import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { AlloyLayout } from "@/components/alloy-layout";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { useAuth } from "@workspace/replit-auth-web";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        const apiErr = error as { status?: number };
        if (apiErr?.status === 401 || apiErr?.status === 403) return false;
        return failureCount < 1;
      },
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const ExecutionRuns = lazy(() => import("@/pages/execution-runs"));
const WorkflowOrchestration = lazy(() => import("@/pages/workflow-orchestration"));
const ConnectorMesh = lazy(() => import("@/pages/connector-mesh"));
const GovernanceAudit = lazy(() => import("@/pages/governance-audit"));
const AutomationAnalytics = lazy(() => import("@/pages/automation-analytics"));
const ConsolePage = lazy(() => import("@/pages/ConsolePage"));
const AlloyMarketingLanding = lazy(() => import("@/pages/marketing-landing"));

const CampaignHub = lazy(() => import("@/pages/creative/campaign-hub").then(m => ({ default: m.CampaignHub })));
const CampaignDetail = lazy(() => import("@/pages/creative/campaign-detail").then(m => ({ default: m.CampaignDetail })));
const BrandVoice = lazy(() => import("@/pages/creative/brand-voice"));
const ContentCalendar = lazy(() => import("@/pages/creative/content-calendar"));
const AIStudio = lazy(() => import("@/pages/creative/ai-studio"));

function PrivateRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={ExecutionRuns} />
        <Route path="/workflows" component={WorkflowOrchestration} />
        <Route path="/connectors" component={ConnectorMesh} />
        <Route path="/governance" component={GovernanceAudit} />
        <Route path="/analytics" component={AutomationAnalytics} />
        <Route path="/console" component={ConsolePage} />
        <Route path="/creative" component={CampaignHub} />
        <Route path="/creative/campaigns/:id" component={CampaignDetail} />
        <Route path="/creative/brand-voice" component={BrandVoice} />
        <Route path="/creative/content-calendar" component={ContentCalendar} />
        <Route path="/creative/ai-studio" component={AIStudio} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const alloyCommands: CommandItem[] = [
  { id: "nav-runs", label: "Execution Runs", icon: "⚡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-workflows", label: "Workflow Orchestration", icon: "🔀", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/workflows"); } },
  { id: "nav-connectors", label: "Connector Mesh", icon: "🔌", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/connectors"); } },
  { id: "nav-governance", label: "Governance & Audit", icon: "🛡️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/governance"); } },
  { id: "nav-analytics", label: "Automation Analytics", icon: "📊", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/analytics"); } },
  { id: "nav-console", label: "Platform Console", icon: "🖥️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/console"); } },
];

const alloyShortcuts: KeyboardShortcut[] = [
  { key: "W", description: "Workflow Orchestration", category: "Navigation" },
  { key: "C", description: "Connector Mesh", category: "Navigation" },
  { key: "G", description: "Governance & Audit", category: "Navigation" },
  { key: "A", description: "Automation Analytics", category: "Navigation" },
  { key: "P", description: "Platform Console", category: "Navigation" },
];

function PrivateApp({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  return (
    <PowerUserProvider shortcuts={alloyShortcuts} appName="Alloy" accentColor="#00d4ff">
      <div className="flex flex-col h-screen bg-[#080c14]">
        <EcosystemNav currentAppId="alloy" currentAppName="Alloy" accentColor="#00d4ff" />
        <div className="flex-1 overflow-hidden">
          <AlloyLayout>
            <PrivateRouter />
          </AlloyLayout>
        </div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={alloyCommands}
        appName="Alloy"
        accentColor="#00d4ff"
      />
    </PowerUserProvider>
  );
}

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080c14" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #00d4ff40", borderTopColor: "#00d4ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div style={{ height: "100vh", background: "#080c14" }} />}>
        <AlloyMarketingLanding onSignIn={login} />
      </Suspense>
    );
  }

  return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(alloyCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
