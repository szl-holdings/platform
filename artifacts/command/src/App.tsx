import { lazy, Suspense, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { Router as WouterRouter, Switch, Route, useLocation, Redirect } from "wouter";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { SandboxModeProvider, SandboxModeBanner, AnalyticsProvider, CortexVoice, CortexVoiceTrigger, useCortexVoice, MultiplayerSessionBanner } from "@szl-holdings/shared-ui";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { commandConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { CommandBar } from "./components/command-bar";
import { UnifiedLayout, type WorkspaceMode } from "./components/unified-layout";
import { DemoModeProvider } from "@lyte/lib/demo-mode";

const BASE = import.meta.env.BASE_URL;
const CorrelationMapPage = lazy(() => import("./pages/correlation-map").then((m) => ({ default: m.CorrelationMapPage })));
const SignalChainsPage = lazy(() => import("./pages/signal-chains").then((m) => ({ default: m.SignalChainsPage })));
const EnterpriseStatePage = lazy(() => import("./pages/enterprise-state"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

if (typeof window !== "undefined") {
  persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({ storage: window.localStorage, key: "command-rq-cache" }),
    maxAge: 1000 * 60 * 60,
    buster: "v1",
  });
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]" style={{ background: "#080c14" }}>
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(139,122,200,0.25)", borderTopColor: "#8b7ac8" }} />
    </div>
  );
}

const Dashboard = lazy(() => import("./pages/dashboard").then((m) => ({ default: m.Dashboard })));
const SimulationPage = lazy(() => import("./pages/simulation"));
const BriefingHistoryPage = lazy(() => import("./pages/briefing-history"));
const DomainDetailPage = lazy(() => import("./pages/domain-detail").then((m) => ({ default: m.DomainDetail })));
const ExecutiveBriefingPage = lazy(() => import("./pages/executive-briefing").then((m) => ({ default: m.ExecutiveBriefing })));

const MarketingHome = lazy(() => import("./pages/marketing").then((m) => ({ default: m.MarketingHome })));
const MarketingAppPage = lazy(() => import("./pages/marketing/apps/[id]").then((m) => ({ default: m.MarketingAppPage })));
const MarketingOpsFeaturePage = lazy(() => import("./pages/marketing/ops/[slug]").then((m) => ({ default: m.MarketingOpsFeaturePage })));
const MarketingPricing = lazy(() => import("./pages/marketing/pricing").then((m) => ({ default: m.MarketingPricing })));
const MarketingSignup = lazy(() => import("./pages/marketing/signup").then((m) => ({ default: m.MarketingSignup })));
const MarketingOnboarding = lazy(() => import("./pages/marketing/onboarding").then((m) => ({ default: m.MarketingOnboarding })));
const MarketingStatus = lazy(() => import("./pages/marketing/status").then((m) => ({ default: m.MarketingStatus })));
const MarketingVerifyEmail = lazy(() => import("./pages/marketing/verify-email").then((m) => ({ default: m.MarketingVerifyEmail })));

const AtlasRuntimePage = lazy(() => import("./pages/atlas-runtime").then(m => ({ default: m.AtlasRuntimePage })));
const WhatChangedPage = lazy(() => import("./operations/pages/what-changed"));
const DeploymentsPage = lazy(() => import("./operations/pages/deployments"));
const ExecutiveCommand = lazy(() => import("@lyte/pages/executive-command"));
const LytePulse = lazy(() => import("@lyte/pages/pulse"));
const PrismDashboard = lazy(() => import("@lyte/pages/prism-dashboard"));
const BlockerBoard = lazy(() => import("@lyte/pages/blocker-board"));
const DigestCenter = lazy(() => import("@lyte/pages/digest-center"));
const TrustAudit = lazy(() => import("@lyte/pages/trust-audit"));
const AlloyActionConsole = lazy(() => import("@lyte/pages/alloy-action-console"));
const AlloyWorkflowCanvas = lazy(() => import("@lyte/pages/alloy-workflow-canvas"));
const AlloyIntelligence = lazy(() => import("@lyte/pages/alloy-intelligence"));
const AlloyGovernance = lazy(() => import("@lyte/pages/alloy-governance"));
const AlloyWorkflowTemplates = lazy(() => import("@lyte/pages/alloy-workflow-templates"));
const AlloyWriteBack = lazy(() => import("@lyte/pages/alloy-write-back"));
const AlloyAgentMonitor = lazy(() => import("@lyte/pages/alloy-agent-monitor"));
const AlloyExecutionTraces = lazy(() => import("@lyte/pages/alloy-execution-traces"));
const AlloyReplayTimeline = lazy(() => import("@lyte/pages/alloy-replay-timeline"));
const AlloyPolicySim = lazy(() => import("@lyte/pages/alloy-policy-sim"));
const AlloyAgentHandoffs = lazy(() => import("@lyte/pages/alloy-agent-handoffs"));
const AlloyTrustReceipts = lazy(() => import("@lyte/pages/alloy-trust-receipts"));
const AlloyIntegrationHealth = lazy(() => import("@lyte/pages/alloy-integration-health"));
const AlloyGraphCompiler = lazy(() => import("@lyte/pages/alloy-graph-compiler"));
const CognitiveCommandCenter = lazy(() => import("./pages/cognitive/index"));
const AlloyProofPage = lazy(() => import("./pages/alloy-proof").then(m => ({ default: m.AlloyProofPage })));
const SelfModelConsole = lazy(() => import("./pages/cognitive/self-model"));
const WorldModelExplorer = lazy(() => import("./pages/cognitive/world-model"));
const ReplayLab = lazy(() => import("./pages/replay-lab"));
const EvalLab = lazy(() => import("./pages/eval-lab"));
const TrustConsole = lazy(() => import("./pages/trust-console"));
const CognitiveMemory = lazy(() => import("./pages/cognitive/memory"));
const CognitivePlanner = lazy(() => import("./pages/cognitive/planner"));
const CognitiveVerifier = lazy(() => import("./pages/cognitive/verifier"));
const CognitiveReflection = lazy(() => import("./pages/cognitive/reflection"));
const CognitiveTraces = lazy(() => import("./pages/cognitive/traces"));
const CognitiveEvals = lazy(() => import("./pages/cognitive/evals"));
const CognitivePolicies = lazy(() => import("./pages/cognitive/policies"));
const PolicyApprovalsPage = lazy(() => import("./pages/policy-approvals"));
const ApprovalsCenter = lazy(() => import("@lyte/pages/approvals-center"));
const CommandInbox = lazy(() => import("@lyte/pages/command-inbox"));
const OwnershipMap = lazy(() => import("@lyte/pages/ownership-map-new"));
const EscalationCenter = lazy(() => import("@lyte/pages/escalation-center"));
const ActionQueue = lazy(() => import("@lyte/pages/action-queue"));
const OperationalQueue = lazy(() => import("@lyte/pages/operational-queue"));
const MetricsExplorer = lazy(() => import("@lyte/pages/metrics-explorer"));
const ServiceTopology = lazy(() => import("@lyte/pages/service-topology"));
const LogExplorer = lazy(() => import("@lyte/pages/log-explorer"));
const AlertManagement = lazy(() => import("@lyte/pages/alert-management"));
const DemoSignals = lazy(() => import("@lyte/pages/demo-signals"));
const DemoAlerts = lazy(() => import("@lyte/pages/demo-alerts"));
const DemoPriorities = lazy(() => import("@lyte/pages/demo-priorities"));
const DemoWorkflows = lazy(() => import("@lyte/pages/demo-workflows"));
const DemoRecommendations = lazy(() => import("@lyte/pages/demo-recommendations"));
const DemoAudit = lazy(() => import("@lyte/pages/demo-audit"));
const DemoExceptions = lazy(() => import("@lyte/pages/demo-exceptions"));
const DemoReadiness = lazy(() => import("@lyte/pages/demo-readiness"));
const AutonomousNOC = lazy(() => import("@lyte/pages/autonomous-noc"));
const DEXScoring = lazy(() => import("@lyte/pages/dex-scoring"));
const RunbookStudio = lazy(() => import("@lyte/pages/runbook-studio"));
const KnowledgeGraph = lazy(() => import("@lyte/pages/knowledge-graph"));
const SelfHealing = lazy(() => import("@lyte/pages/self-healing"));
const SLOManagement = lazy(() => import("@lyte/pages/slo-management"));
const FinOps = lazy(() => import("@lyte/pages/finops"));
const DistributedTracing = lazy(() => import("@lyte/pages/distributed-tracing"));
const OnCallCenter = lazy(() => import("@lyte/pages/oncall-center"));
const NoiseReduction = lazy(() => import("@lyte/pages/noise-reduction"));
const CapacityPlanning = lazy(() => import("@lyte/pages/capacity-planning"));
const ChangeManagement = lazy(() => import("@lyte/pages/change-management"));
const SyntheticMonitoring = lazy(() => import("@lyte/pages/synthetic-monitoring"));
const RevenueImpact = lazy(() => import("@lyte/pages/revenue-impact"));
const BusinessSignalsIntelligence = lazy(() => import("@lyte/pages/business-signals-intelligence"));
const LytePredictiveIntelligence = lazy(() => import("@lyte/pages/predictive-intelligence"));
const LivingTopology = lazy(() => import("@lyte/pages/living-topology"));
const GovernedDecisionLoop = lazy(() => import("@lyte/pages/governed-decision-loop"));
const CognitiveRuntime = lazy(() => import("@lyte/pages/cognitive-runtime"));
const AIQualityDashboard = lazy(() => import("@lyte/pages/ai-quality-dashboard"));

const LegatusConsole = lazy(() => import("@imp/pages/legatus-console"));
const ImperiumMap = lazy(() => import("@imp/pages/imperium-map"));
const PraetorianGuard = lazy(() => import("@imp/pages/praetorian-guard"));
const SenateChamber = lazy(() => import("@imp/pages/senate-chamber"));
const SupplyLines = lazy(() => import("@imp/pages/supply-lines"));
const CenturionAI = lazy(() => import("@imp/pages/centurion-ai"));
const IntelligenceBriefing = lazy(() => import("@imp/pages/intelligence-briefing"));
const GeospatialIntelligence = lazy(() => import("@imp/pages/geospatial"));
const DirectiveCascade = lazy(() => import("@imp/pages/directive-cascade"));
const Coalition = lazy(() => import("@imp/pages/coalition"));
const StrategicReserves = lazy(() => import("@imp/pages/strategic-reserves"));

function getMode(location: string): WorkspaceMode {
  if (location.startsWith("/operations") || location.startsWith("/cognitive")) return "operations";
  if (location.startsWith("/infrastructure")) return "infrastructure";
  return "strategy";
}

const OPS_ROUTES = ["/alerts", "/team", "/costs", "/changelog", "/sla", "/governance", "/health", "/digest"];

function AppShell() {
  const [location, navigate] = useLocation();
  const { open: cortexOpen, setOpen: setCortexOpen } = useCortexVoice();
  const [searchOpen, setSearchOpen] = useState(false);

  const isMarketing = location.startsWith("/marketing");

  const mode = getMode(location);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (isMarketing) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/marketing" component={() => <MarketingHome />} />
          <Route path="/marketing/apps/:id" component={() => <MarketingAppPage />} />
          <Route path="/marketing/ops/:slug" component={() => <MarketingOpsFeaturePage />} />
          <Route path="/marketing/pricing" component={() => <MarketingPricing />} />
          <Route path="/marketing/signup" component={() => <MarketingSignup />} />
          <Route path="/marketing/onboarding" component={() => <MarketingOnboarding />} />
          <Route path="/marketing/status" component={() => <MarketingStatus />} />
          <Route path="/marketing/verify-email" component={() => <MarketingVerifyEmail />} />
        </Switch>
      </Suspense>
    );
  }

  const accent = mode === "strategy" ? "#8b7ac8" : mode === "operations" ? "#d4a054" : "#c9a227";

  return (
    <>
      <MultiplayerSessionBanner sessionId="cmd-unified" currentUserName="You" accentColor={accent} />
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={accent} />
      <CommandBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CortexVoice open={cortexOpen} onClose={() => setCortexOpen(false)} accentColor={accent} appName="Command" />
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9990 }}>
        <CortexVoiceTrigger accentColor={accent} onClick={() => setCortexOpen(true)} />
      </div>

      <div style={{ height: "calc(100vh - 40px)", overflow: "hidden" }}>
        <UnifiedLayout
          mode={mode}
          onModeChange={(m) => {
            if (m === "strategy") navigate("/strategy");
            else if (m === "operations") navigate("/operations");
            else navigate("/infrastructure");
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/">
                <Redirect to="/strategy" />
              </Route>

              <Route path="/strategy" component={() => <Dashboard />} />
              <Route path="/strategy/domain/:id" component={() => <DomainDetailPage />} />
              <Route path="/strategy/executive-briefing" component={() => <ExecutiveBriefingPage />} />
              <Route path="/strategy/simulation" component={() => <SimulationPage />} />
              <Route path="/strategy/briefing" component={() => <BriefingHistoryPage />} />
              <Route path="/strategy/correlation-map" component={() => <CorrelationMapPage />} />
              <Route path="/strategy/signal-chains" component={() => <SignalChainsPage />} />
              <Route path="/strategy/enterprise-state" component={() => <EnterpriseStatePage />} />
              <Route path="/strategy/atlas-runtime" component={() => <AtlasRuntimePage />} />
              <Route path="/cognitive" component={() => <CognitiveCommandCenter />} />
              <Route path="/cognitive/self-model" component={() => <SelfModelConsole />} />
              <Route path="/cognitive/world-model" component={() => <WorldModelExplorer />} />
              <Route path="/command/atlas-runtime" component={() => <AtlasRuntimePage />} />

              <Route path="/operations" component={() => <ExecutiveCommand />} />
              <Route path="/operations/pulse" component={() => <LytePulse />} />
              <Route path="/operations/prism" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/pulse" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/risk" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/intelligence" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/signals" component={() => <DemoSignals />} />
              <Route path="/operations/prism/motion" component={() => <ActionQueue />} />
              <Route path="/operations/blocker-board" component={() => <BlockerBoard />} />
              <Route path="/operations/what-changed" component={() => <WhatChangedPage />} />
              <Route path="/operations/deployments" component={() => <DeploymentsPage />} />
              <Route path="/lyte/what-changed" component={() => <WhatChangedPage />} />
              <Route path="/operations/digest" component={() => <DigestCenter />} />
              <Route path="/operations/trust-audit" component={() => <TrustAudit />} />
              <Route path="/operations/approvals" component={() => <ApprovalsCenter />} />
              <Route path="/operations/policy-approvals" component={() => <PolicyApprovalsPage />} />
              <Route path="/operations/inbox" component={() => <CommandInbox />} />
              <Route path="/operations/ownership" component={() => <OwnershipMap />} />
              <Route path="/operations/escalation" component={() => <EscalationCenter />} />
              <Route path="/operations/queue" component={() => <OperationalQueue />} />
              <Route path="/operations/action-queue" component={() => <ActionQueue />} />
              <Route path="/operations/signals" component={() => <DemoSignals />} />
              <Route path="/operations/alerts" component={() => <DemoAlerts />} />
              <Route path="/operations/priorities" component={() => <DemoPriorities />} />
              <Route path="/operations/workflows" component={() => <DemoWorkflows />} />
              <Route path="/operations/recommendations" component={() => <DemoRecommendations />} />
              <Route path="/operations/audit" component={() => <DemoAudit />} />
              <Route path="/operations/exceptions" component={() => <DemoExceptions />} />
              <Route path="/operations/readiness" component={() => <DemoReadiness />} />
              <Route path="/operations/metrics" component={() => <MetricsExplorer />} />
              <Route path="/operations/topology" component={() => <ServiceTopology />} />
              <Route path="/operations/logs" component={() => <LogExplorer />} />
              <Route path="/operations/alert-management" component={() => <AlertManagement />} />
              <Route path="/operations/autonomous-noc" component={() => <AutonomousNOC />} />
              <Route path="/operations/dex" component={() => <DEXScoring />} />
              <Route path="/operations/runbook-studio" component={() => <RunbookStudio />} />
              <Route path="/operations/knowledge-graph" component={() => <KnowledgeGraph />} />
              <Route path="/operations/self-healing" component={() => <SelfHealing />} />
              <Route path="/operations/slo" component={() => <SLOManagement />} />
              <Route path="/operations/finops" component={() => <FinOps />} />
              <Route path="/operations/tracing" component={() => <DistributedTracing />} />
              <Route path="/operations/on-call" component={() => <OnCallCenter />} />
              <Route path="/operations/noise-reduction" component={() => <NoiseReduction />} />
              <Route path="/operations/capacity-planning" component={() => <CapacityPlanning />} />
              <Route path="/operations/change-management" component={() => <ChangeManagement />} />
              <Route path="/operations/synthetic" component={() => <SyntheticMonitoring />} />
              <Route path="/operations/revenue-impact" component={() => <RevenueImpact />} />
              <Route path="/operations/business-signals" component={() => <BusinessSignalsIntelligence />} />
              <Route path="/operations/predictive-intelligence" component={() => <LytePredictiveIntelligence />} />
              <Route path="/operations/living-topology" component={() => <LivingTopology />} />
              <Route path="/operations/governed-decision-loop" component={() => <GovernedDecisionLoop />} />
              <Route path="/operations/cognitive-runtime" component={() => <CognitiveRuntime />} />
              <Route path="/operations/ai-ops" component={() => <AIQualityDashboard />} />
              <Route path="/operations/alloy/canvas" component={() => <AlloyWorkflowCanvas />} />
              <Route path="/operations/alloy/actions" component={() => <AlloyActionConsole />} />
              <Route path="/operations/alloy/templates" component={() => <AlloyWorkflowTemplates />} />
              <Route path="/operations/alloy/gates" component={() => <AlloyWriteBack />} />
              <Route path="/operations/alloy/intelligence" component={() => <AlloyIntelligence />} />
              <Route path="/operations/alloy/governance" component={() => <AlloyGovernance />} />
              <Route path="/operations/alloy/agents" component={() => <AlloyAgentMonitor />} />
              <Route path="/operations/alloy/traces" component={() => <AlloyExecutionTraces />} />
              <Route path="/operations/alloy/replay" component={() => <AlloyReplayTimeline />} />
              <Route path="/operations/alloy/simulate" component={() => <AlloyPolicySim />} />
              <Route path="/operations/alloy/handoffs" component={() => <AlloyAgentHandoffs />} />
              <Route path="/operations/alloy/receipts" component={() => <AlloyTrustReceipts />} />
              <Route path="/operations/alloy/integrations" component={() => <AlloyIntegrationHealth />} />
              <Route path="/operations/alloy/compiler" component={() => <AlloyGraphCompiler />} />
              <Route path="/operations/alloy/replay-lab" component={() => <ReplayLab />} />
              <Route path="/operations/alloy/eval-lab" component={() => <EvalLab />} />
              <Route path="/operations/alloy/trust-console" component={() => <TrustConsole />} />
              <Route path="/operations/alloy/proof" component={() => <AlloyProofPage />} />

              <Route path="/cognitive/memory" component={() => <CognitiveMemory />} />
              <Route path="/cognitive/planner" component={() => <CognitivePlanner />} />
              <Route path="/cognitive/verifier" component={() => <CognitiveVerifier />} />
              <Route path="/cognitive/reflection" component={() => <CognitiveReflection />} />
              <Route path="/cognitive/traces" component={() => <CognitiveTraces />} />
              <Route path="/cognitive/evals" component={() => <CognitiveEvals />} />
              <Route path="/cognitive/policies" component={() => <CognitivePolicies />} />

              <Route path="/infrastructure" component={() => <LegatusConsole />} />
              <Route path="/infrastructure/legatus" component={() => <LegatusConsole />} />
              <Route path="/infrastructure/imperium-map" component={() => <ImperiumMap />} />
              <Route path="/infrastructure/praetorian" component={() => <PraetorianGuard />} />
              <Route path="/infrastructure/senate" component={() => <SenateChamber />} />
              <Route path="/infrastructure/supply-lines" component={() => <SupplyLines />} />
              <Route path="/infrastructure/centurion" component={() => <CenturionAI />} />
              <Route path="/infrastructure/intelligence" component={() => <IntelligenceBriefing />} />
              <Route path="/infrastructure/geospatial" component={() => <GeospatialIntelligence />} />
              <Route path="/infrastructure/directives" component={() => <DirectiveCascade />} />
              <Route path="/infrastructure/coalition" component={() => <Coalition />} />
              <Route path="/infrastructure/reserves" component={() => <StrategicReserves />} />

              <Route>
                <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
              </Route>
            </Switch>
          </Suspense>
        </UnifiedLayout>
      </div>

      <AgentCopilot config={commandConfig} />
    </>
  );
}

function App() {
  return (
    <AnalyticsProvider appName="command">
      <PrismBusProvider domain="lyte">
        <SandboxModeProvider>
          <DemoModeProvider>
            <QueryClientProvider client={queryClient}>
              <WouterRouter base={BASE.replace(/\/$/, "")}>
                <AppShell />
              </WouterRouter>
            </QueryClientProvider>
          </DemoModeProvider>
        </SandboxModeProvider>
      </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
