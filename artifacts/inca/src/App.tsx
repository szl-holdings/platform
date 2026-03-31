import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation, Redirect } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { DemoModeProvider } from "@workspace/shared-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { Brain, FlaskConical, LayoutDashboard, FolderKanban, Lightbulb, Cpu, Beaker, TrendingUp, BellRing, Layers, Activity, Eye, Link2, BarChart3, Boxes, GitBranch, Database, Trophy, ChevronRight, Plus, Radio, Sun, Network, Settings, Users, FileText, Shield } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";

// Marketing pages
const IncaMarketingHome = lazy(() => import("@/pages/marketing-home"));
const IncaPlatformPage = lazy(() => import("@/pages/marketing-platform"));
const IncaCapabilitiesPage = lazy(() => import("@/pages/marketing-capabilities"));
const IncaSecurityPage = lazy(() => import("@/pages/marketing-security"));
const IncaInsightsPage = lazy(() => import("@/pages/marketing-insights"));
const RequestAccessPage = lazy(() => import("@/pages/marketing-request-access"));
const SignInPage = lazy(() => import("@/pages/marketing-sign-in"));
const LegalPrivacyPage = lazy(() => import("@/pages/legal-privacy"));
const LegalTermsPage = lazy(() => import("@/pages/legal-terms"));

// Dashboard / product pages
const Dashboard = lazy(() => import("@/pages/dashboard"));
const QuipuCommand = lazy(() => import("@/pages/quipu-command"));
const AgentSpawner = lazy(() => import("@/pages/agent-spawner"));
const ChasquiRelay = lazy(() => import("@/pages/chasqui-relay"));
const DualMindMonitor = lazy(() => import("@/pages/dual-mind-monitor"));
const WillaqUmu = lazy(() => import("@/pages/willaq-umu"));
const Projects = lazy(() => import("@/pages/projects"));
const ProjectDetail = lazy(() => import("@/pages/project-detail"));
const Experiments = lazy(() => import("@/pages/experiments"));
const Models = lazy(() => import("@/pages/models"));
const Insights = lazy(() => import("@/pages/insights"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const Predictions = lazy(() => import("@/pages/predictions"));
const AlertsManagement = lazy(() => import("@/pages/alerts-management"));
const EnsembleStudio = lazy(() => import("@/pages/ensemble-studio"));
const PredictionDrift = lazy(() => import("@/pages/prediction-drift"));
const AnomalyTimeline = lazy(() => import("@/pages/anomaly-timeline"));
const AlertCorrelation = lazy(() => import("@/pages/alert-correlation"));
const ConfidenceHistogram = lazy(() => import("@/pages/confidence-histogram"));
const ScenarioBuilder = lazy(() => import("@/pages/scenario-builder"));
const CorrelationAnalysis = lazy(() => import("@/pages/correlation-analysis"));
const ModelRegistry = lazy(() => import("@/pages/model-registry"));
const NeuralExplorer = lazy(() => import("@/pages/neural-explorer"));
const Benchmarking = lazy(() => import("@/pages/benchmarking"));
const GPUMonitoring = lazy(() => import("@/pages/gpu-monitoring"));
const LLMEvaluation = lazy(() => import("@/pages/llm-evaluation"));
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const primaryDashboardNav = [
  { path: "/dashboard", label: "Research Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/signals", label: "Signal Feed", icon: Radio },
  { path: "/dashboard/findings", label: "Research Findings", icon: Eye },
  { path: "/dashboard/investigations", label: "Investigations", icon: FolderKanban },
  { path: "/dashboard/alerts", label: "Alerts", icon: BellRing },
  { path: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

const researchNavItems = [
  { path: "/projects", label: "Research Projects", icon: FolderKanban },
  { path: "/experiments", label: "Experiment Tracker", icon: FlaskConical },
  { path: "/models", label: "Model Registry", icon: Cpu },
  { path: "/neural-explorer", label: "Neural Explorer", icon: Brain },
  { path: "/ensemble", label: "Ensemble Studio", icon: Layers },
  { path: "/registry", label: "Version Registry", icon: Database },
  { path: "/benchmarking", label: "Benchmarking Suite", icon: Trophy },
  { path: "/llm-eval", label: "LLM Evaluation", icon: FlaskConical },
  { path: "/gpu-monitoring", label: "GPU Monitor", icon: Cpu },
];

const cortexNavItems = [
  { path: "/quipu-command", label: "Quipu Command", icon: Network },
  { path: "/agent-spawner", label: "Agent Spawner", icon: Plus },
  { path: "/chasqui-relay", label: "Chasqui Relay", icon: Radio },
  { path: "/dual-mind", label: "Dual-Mind Monitor", icon: Sun },
  { path: "/willaq-umu", label: "Willaq Umu Oracle", icon: Eye },
  { path: "/agent-insights", label: "Agent Insights", icon: Brain },
];

const adminDashboardNav = [
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
  { path: "/dashboard/team", label: "Team", icon: Users },
  { path: "/dashboard/audit-log", label: "Audit Log", icon: FileText },
];

const secondaryNavItems = [
  { path: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { path: "/observability", label: "Observability", icon: Activity },
  { path: "/predictions", label: "Predictions", icon: TrendingUp },
  { path: "/drift", label: "Prediction Drift", icon: Activity },
  { path: "/anomalies", label: "Anomaly Timeline", icon: Eye },
  { path: "/correlation-alerts", label: "Alert Correlation", icon: Link2 },
  { path: "/confidence", label: "Confidence Histogram", icon: BarChart3 },
  { path: "/scenarios", label: "Scenario Builder", icon: Boxes },
  { path: "/correlations", label: "Correlation Analysis", icon: GitBranch },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function DashboardSidebar() {
  const [location] = useLocation();
  const [cortexExpanded, setCortexExpanded] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);

  const NavItem = ({ path, label, icon: Icon, dimmed = false }: { path: string; label: string; icon: typeof Brain; dimmed?: boolean }) => {
    const isActive = path === "/dashboard" ? location === "/dashboard" : location.startsWith(path);
    return (
      <Link key={path} href={path}>
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative",
          isActive ? "bg-amber-400/10 text-amber-400" : dimmed ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}>
          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400 rounded-r-full" />}
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </div>
      </Link>
    );
  };

  return (
    <aside className="w-60 bg-[#0d0a1a]/80 border-r border-violet-500/10 flex flex-col h-screen sticky top-0 backdrop-blur-sm">
      <div className="px-4 py-4 border-b border-violet-500/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(16,185,129,0.12))" }}>
            <Brain className="w-4 h-4 text-amber-400 animate-neural-pulse" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-foreground tracking-tight">INCA</h1>
            <p className="text-[10px] text-amber-400/60 font-mono uppercase tracking-[0.1em]">AI Research Command</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        <div>
          <div className="px-3 pb-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-amber-400/50">Intelligence Feed</span>
          </div>
          <div className="space-y-0.5">
            {primaryDashboardNav.map(({ path, label, icon: Icon }) => (
              <NavItem key={path} path={path} label={label} icon={Icon} />
            ))}
          </div>
        </div>

        <div>
          <div className="px-3 pb-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-amber-400/50">Research Lab</span>
          </div>
          <div className="space-y-0.5">
            {researchNavItems.map(({ path, label, icon: Icon }) => (
              <NavItem key={path} path={path} label={label} icon={Icon} />
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => setCortexExpanded(!cortexExpanded)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-mono uppercase tracking-[0.15em] text-amber-400/40 hover:text-amber-400/70 transition-all w-full"
          >
            <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", cortexExpanded && "rotate-90")} />
            Agentic Cortex
          </button>
          {cortexExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {cortexNavItems.map(({ path, label, icon: Icon }) => (
                <NavItem key={path} path={path} label={label} icon={Icon} dimmed />
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setMoreExpanded(!moreExpanded)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/30 hover:text-muted-foreground/60 transition-all w-full"
          >
            <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", moreExpanded && "rotate-90")} />
            Analysis Tools
          </button>
          {moreExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {secondaryNavItems.map(({ path, label, icon: Icon }) => (
                <NavItem key={path} path={path} label={label} icon={Icon} dimmed />
              ))}
              {adminDashboardNav.map(({ path, label, icon: Icon }) => (
                <NavItem key={path} path={path} label={label} icon={Icon} dimmed />
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-violet-500/10 space-y-2">
        <UserButton showName className="w-full" />
        <div className="flex items-center gap-2 text-[10px] text-amber-400/30">
          <Brain className="w-3 h-3" />
          <span className="font-mono">SZL Holdings · AI Research</span>
        </div>
      </div>
    </aside>
  );
}

function DashboardRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/signals/:id">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Signal Detail</h1><p className="text-muted-foreground text-sm">Signal detail view — full investigation context and evidence chain.</p></div>
        </Route>
        <Route path="/dashboard/signals">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Signals</h1><p className="text-muted-foreground text-sm">Active intelligence signals — prioritised and enriched for analyst review.</p></div>
        </Route>
        <Route path="/dashboard/findings/:id">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Finding Detail</h1><p className="text-muted-foreground text-sm">Structured finding with evidence chain and explainability output.</p></div>
        </Route>
        <Route path="/dashboard/findings">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Findings</h1><p className="text-muted-foreground text-sm">Intelligence findings awaiting review, in progress, or resolved.</p></div>
        </Route>
        <Route path="/dashboard/investigations/:id">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Investigation Detail</h1><p className="text-muted-foreground text-sm">Multi-stage investigation with linked signals, findings, and decision log.</p></div>
        </Route>
        <Route path="/dashboard/investigations">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Investigations</h1><p className="text-muted-foreground text-sm">Open and closed investigations with full audit trail.</p></div>
        </Route>
        <Route path="/dashboard/alerts" component={AlertsManagement} />
        <Route path="/dashboard/reports">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Reports</h1><p className="text-muted-foreground text-sm">Intelligence reporting, trend analysis, and executive briefing exports.</p></div>
        </Route>
        <Route path="/dashboard/settings">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Settings</h1><p className="text-muted-foreground text-sm">Organisation settings, API configuration, and integration management.</p></div>
        </Route>
        <Route path="/dashboard/team">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Team</h1><p className="text-muted-foreground text-sm">Manage team members, roles, and access permissions.</p></div>
        </Route>
        <Route path="/dashboard/audit-log">
          <div className="p-6 max-w-xl mx-auto"><h1 className="text-xl font-bold text-foreground mb-2">Audit Log</h1><p className="text-muted-foreground text-sm">Immutable audit trail of all platform actions, data access, and configuration changes.</p></div>
        </Route>
        {/* Legacy routes */}
        <Route path="/quipu-command" component={QuipuCommand} />
        <Route path="/agent-spawner" component={AgentSpawner} />
        <Route path="/chasqui-relay" component={ChasquiRelay} />
        <Route path="/dual-mind" component={DualMindMonitor} />
        <Route path="/willaq-umu" component={WillaqUmu} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/experiments" component={Experiments} />
        <Route path="/models" component={Models} />
        <Route path="/dashboard/insights" component={Insights} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/predictions" component={Predictions} />
        <Route path="/alerts" component={AlertsManagement} />
        <Route path="/ensemble" component={EnsembleStudio} />
        <Route path="/drift" component={PredictionDrift} />
        <Route path="/anomalies" component={AnomalyTimeline} />
        <Route path="/correlation-alerts" component={AlertCorrelation} />
        <Route path="/confidence" component={ConfidenceHistogram} />
        <Route path="/scenarios" component={ScenarioBuilder} />
        <Route path="/correlations" component={CorrelationAnalysis} />
        <Route path="/registry" component={ModelRegistry} />
        <Route path="/neural-explorer" component={NeuralExplorer} />
        <Route path="/benchmarking" component={Benchmarking} />
        <Route path="/gpu-monitoring" component={GPUMonitoring} />
        <Route path="/llm-eval" component={LLMEvaluation} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground font-mono">404 — Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const incaCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", icon: "🧠", group: "Navigation", keywords: ["home", "overview"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard"); } },
  { id: "nav-signals", label: "Signals", icon: "📡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard/signals"); } },
  { id: "nav-findings", label: "Findings", icon: "🔍", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard/findings"); } },
  { id: "nav-experiments", label: "Experiments", icon: "🧪", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/experiments"); } },
  { id: "nav-models", label: "Models", icon: "⚙️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/models"); } },
  { id: "nav-gpu", label: "GPU Monitor", icon: "🖥️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/gpu-monitoring"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
];

const incaShortcuts: KeyboardShortcut[] = [
  { key: "E", description: "Go to Experiments", category: "Navigation" },
  { key: "M", description: "Go to Models", category: "Navigation" },
  { key: "P", description: "Go to Predictions", category: "Navigation" },
  { key: "G", description: "Go to GPU Monitor", category: "Navigation" },
];

function DashboardShell({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  return (
    <PowerUserProvider shortcuts={incaShortcuts} appName="INCA" accentColor="#f59e0b">
      <div className="flex flex-col h-screen bg-background">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <EcosystemNav currentAppId="inca" currentAppName="INCA — AI Research Command" accentColor="#f59e0b" />
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
            <DashboardRouter />
          </main>
        </div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={incaCommands}
        appName="INCA"
        accentColor="#f59e0b"
      />
    </PowerUserProvider>
  );
}

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [location] = useLocation();
  const isDashboard = location.startsWith("/dashboard") ||
    location.startsWith("/quipu") || location.startsWith("/agent-spawner") ||
    location.startsWith("/chasqui") || location.startsWith("/dual-mind") ||
    location.startsWith("/willaq-umu") || location.startsWith("/projects") ||
    location.startsWith("/experiments") || location.startsWith("/models") ||
    location.startsWith("/observability") ||
    location.startsWith("/predictions") || location.startsWith("/alerts") ||
    location.startsWith("/ensemble") || location.startsWith("/drift") ||
    location.startsWith("/anomalies") || location.startsWith("/correlation-alerts") ||
    location.startsWith("/confidence") || location.startsWith("/scenarios") ||
    location.startsWith("/correlations") || location.startsWith("/registry") ||
    location.startsWith("/neural-explorer") || location.startsWith("/benchmarking") ||
    location.startsWith("/gpu-monitoring") || location.startsWith("/llm-eval") ||
    location.startsWith("/agent-insights");

  if (isDashboard) {
    return <DashboardShell cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#060410]"><div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/" component={IncaMarketingHome} />
        <Route path="/platform" component={IncaPlatformPage} />
        <Route path="/capabilities" component={IncaCapabilitiesPage} />
        <Route path="/security" component={IncaSecurityPage} />
        <Route path="/insights" component={IncaInsightsPage} />
        <Route path="/insights-hub">
          <Redirect to="/insights" />
        </Route>
        <Route path="/request-access" component={RequestAccessPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/legal/privacy" component={LegalPrivacyPage} />
        <Route path="/legal/terms" component={LegalTermsPage} />
        <Route component={IncaMarketingHome} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(incaCommands);

  return (
    <DemoModeProvider>
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
      </WouterRouter>
    </QueryClientProvider>
    </DemoModeProvider>
  );
}

export default App;
