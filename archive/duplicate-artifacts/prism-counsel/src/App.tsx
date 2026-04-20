import { CookieBanner } from "@szl-holdings/shared-ui/cookie-banner";
import { OnboardingWizard } from "@szl-holdings/shared-ui/onboarding";
import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { SandboxModeProvider, SandboxModeBanner, useSandboxMode } from "@szl-holdings/shared-ui/sandbox-mode";
import { AppModeBanner, AppModeProvider } from "@szl-holdings/shared-ui/app-mode-banner";
import { DemoNarrativeSidebar } from "@szl-holdings/shared-ui/demo-narrative-sidebar";
import { PRISM_DEMO_NARRATIVE } from "@/data/demo-narrative";
import { AnalyticsProvider } from "@szl-holdings/shared-ui/analytics-provider";
import { PRISM_ONBOARDING_CONFIG } from "@/onboarding-config";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { prismConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, getEcosystemSwitchCommands, createBaselineWebActions, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@szl-holdings/shared-ui/keyboard-shortcuts";
import { StaleIndicator } from "@szl-holdings/shared-ui/stale-indicator";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { PrismLayout } from "@/components/prism-layout";

const PRISM_ACCENT = LANE_ACCENT_HEX.prismCounsel.primary;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 1 } },
});

if (typeof window !== "undefined") {
  persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({ storage: window.localStorage, key: "prism-counsel-rq-cache" }),
    maxAge: 1000 * 60 * 60,
    buster: "v1",
  });
}

const MarketingLanding = lazy(() => import("@/pages/marketing-landing"));
const ObligationTimelinePage = lazy(() => import("@/pages/obligation-timeline"));
const MatterBoard = lazy(() => import("@/pages/matter-board"));
const ObligationGraph = lazy(() => import("@/pages/obligation-graph"));
const DeadlineHeatmap = lazy(() => import("@/pages/deadline-heatmap"));
const ProofChainExport = lazy(() => import("@/pages/proof-chain-export"));
const PrivilegeControls = lazy(() => import("@/pages/privilege-controls"));
const AuditTrailPage = lazy(() => import("@/pages/audit-trail"));
const PrismEvidencePage = lazy(() => import("@/pages/evidence"));
const AefKnowledgeSearchPage = lazy(() => import("@/pages/aef-knowledge-search"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(167,139,250,0.2)", borderTopColor: PRISM_ACCENT }} />
    </div>
  );
}

function PrivateRouter() {
  return (
    <PrismLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={() => <Redirect to="/matters" />} />
          <Route path="/obligation-timeline" component={ObligationTimelinePage} />
          <Route path="/matters" component={MatterBoard} />
          <Route path="/obligation-graph" component={ObligationGraph} />
          <Route path="/obligation-graph/:matterId" component={ObligationGraph} />
          <Route path="/deadline-heatmap" component={DeadlineHeatmap} />
          <Route path="/proof-chain" component={ProofChainExport} />
          <Route path="/proof-chain/:matterId" component={ProofChainExport} />
          <Route path="/privilege" component={PrivilegeControls} />
          <Route path="/audit" component={AuditTrailPage} />
          <Route path="/evidence" component={PrismEvidencePage} />
          <Route path="/aef-search" component={AefKnowledgeSearchPage} />
          <Route component={() => <Redirect to="/matters" />} />
        </Switch>
      </Suspense>
    </PrismLayout>
  );
}

const prismCommands: CommandItem[] = [
  { id: "nav-matters", label: "Matter Board", icon: "◼", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/matters"); } },
  { id: "nav-obligation", label: "Obligation Graph", icon: "◈", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/obligation-graph"); } },
  { id: "nav-heatmap", label: "Deadline Heatmap", icon: "▦", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/deadline-heatmap"); } },
  { id: "nav-proof", label: "Proof Chain Export", icon: "⊞", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/proof-chain"); } },
  { id: "nav-privilege", label: "Privilege Controls", icon: "⊕", group: "Governance", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/privilege"); } },
  { id: "nav-audit", label: "Audit Trail", icon: "⊙", group: "Governance", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/audit"); } },
  ...createBaselineWebActions(
    (path) => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, path); },
    { helpUrl: "https://szlholdings.com/docs/prism", themeToggle: { label: "Toggle Theme", action: () => { document.documentElement.classList.toggle("light"); } } }
  ),
  ...getEcosystemSwitchCommands("prism-counsel"),
];

const prismShortcuts: KeyboardShortcut[] = [
  { key: "M", description: "Matter Board", category: "Navigation" },
  { key: "O", description: "Obligation Graph", category: "Navigation" },
  { key: "H", description: "Deadline Heatmap", category: "Navigation" },
  { key: "P", description: "Proof Chain", category: "Navigation" },
];

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { sandboxActive, enableSandbox } = useSandboxMode();
  const [currentPath] = useLocation();

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const demoMode = params.get("view") === "app" || params.get("demo") === "true";

  useEffect(() => {
    if (demoMode && !sandboxActive) {
      enableSandbox();
    }
  }, [demoMode, sandboxActive, enableSandbox]);

  if (demoMode) {
    return (
      <PowerUserProvider shortcuts={prismShortcuts} appName="PRISM Counsel" accentColor={PRISM_ACCENT}>
        <div className="flex flex-col h-screen" style={{ background: "#080810" }}>
          <EcosystemNav currentAppId="prism-counsel" currentAppName="PRISM Counsel — Legal Command" accentColor={PRISM_ACCENT} />
          <SandboxModeBanner />
          <div className="flex-1 overflow-hidden">
            <PrivateRouter />
          </div>
        </div>
        <DemoNarrativeSidebar
          title={PRISM_DEMO_NARRATIVE.title}
          scenario={PRISM_DEMO_NARRATIVE.scenario}
          steps={PRISM_DEMO_NARRATIVE.steps}
          accentColor={PRISM_ACCENT}
          storageKey="prism-counsel-demo-narrative"
        />
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={prismCommands} appName="PRISM Counsel" accentColor={PRISM_ACCENT} />
        <OnboardingWizard config={PRISM_ONBOARDING_CONFIG} />
      </PowerUserProvider>
    );
  }

  if (currentPath === "/obligation-timeline" || currentPath.startsWith("/obligation-timeline?")) {
    return (
      <Suspense fallback={<div style={{ height: "100vh", background: "#080810" }} />}>
        <ObligationTimelinePage />
      </Suspense>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080810" }}>
        <div style={{ width: 22, height: 22, border: "2px solid rgba(167,139,250,0.2)", borderTopColor: PRISM_ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div style={{ height: "100vh", background: "#080810" }} />}>
        <MarketingLanding onSignIn={login} />
      </Suspense>
    );
  }

  return (
    <PowerUserProvider shortcuts={prismShortcuts} appName="PRISM Counsel" accentColor={PRISM_ACCENT}>
      <div className="flex flex-col h-screen" style={{ background: "#080810" }}>
        <EcosystemNav currentAppId="prism-counsel" currentAppName="PRISM Counsel — Legal Command" accentColor={PRISM_ACCENT} />
        <SandboxModeBanner />
        <div className="flex-1 overflow-hidden">
          <PrivateRouter />
        </div>
      </div>
      {sandboxActive && (
        <DemoNarrativeSidebar
          title={PRISM_DEMO_NARRATIVE.title}
          scenario={PRISM_DEMO_NARRATIVE.scenario}
          steps={PRISM_DEMO_NARRATIVE.steps}
          accentColor={PRISM_ACCENT}
          storageKey="prism-counsel-demo-narrative"
        />
      )}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={prismCommands} appName="PRISM Counsel" accentColor={PRISM_ACCENT} />
      <OnboardingWizard config={PRISM_ONBOARDING_CONFIG} />
    </PowerUserProvider>
  );
}

export { PRISM_ONBOARDING_CONFIG };

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(prismCommands);

  return (
    <AppModeProvider>
    <AppModeBanner />
    <AnalyticsProvider appName="prism-counsel">
    <PrismBusProvider domain="prism-counsel">
    <SandboxModeProvider>
      <QueryClientProvider client={queryClient}>
        <StaleIndicator accentColor={PRISM_ACCENT} />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
          <AgentCopilot config={prismConfig} />
          <Toaster />
          <McpOverlay domain="prism-counsel" />
        </WouterRouter>
      </QueryClientProvider>
    </SandboxModeProvider>
    </PrismBusProvider>
    <CookieBanner privacyUrl="/legal/privacy" />
    </AnalyticsProvider>
    </AppModeProvider>
  );
}

export default App;
