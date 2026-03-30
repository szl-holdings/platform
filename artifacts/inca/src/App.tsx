import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { Brain, FlaskConical, LayoutDashboard, FolderKanban, Lightbulb, Cpu, TrendingUp, BellRing, Layers, Activity, Eye, Link2, BarChart3, Boxes, GitBranch, Database, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";

const Dashboard = lazy(() => import("@/pages/dashboard"));
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const primaryNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/experiments", label: "Experiments", icon: FlaskConical },
  { path: "/models", label: "Models", icon: Cpu },
  { path: "/registry", label: "Model Registry", icon: Database },
  { path: "/predictions", label: "Predictions", icon: TrendingUp },
  { path: "/gpu-monitoring", label: "GPU Monitor", icon: Activity },
];

const secondaryNavItems = [
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/insights", label: "Insights", icon: Lightbulb },
  { path: "/alerts", label: "Alerts", icon: BellRing },
  { path: "/ensemble", label: "Ensemble Studio", icon: Layers },
  { path: "/drift", label: "Prediction Drift", icon: Activity },
  { path: "/anomalies", label: "Anomaly Timeline", icon: Eye },
  { path: "/correlation-alerts", label: "Alert Correlation", icon: Link2 },
  { path: "/confidence", label: "Confidence", icon: BarChart3 },
  { path: "/scenarios", label: "Scenario Builder", icon: Boxes },
  { path: "/correlations", label: "Correlations", icon: GitBranch },
  { path: "/neural-explorer", label: "Neural Explorer", icon: Brain },
  { path: "/benchmarking", label: "Benchmarking", icon: Trophy },
  { path: "/llm-eval", label: "LLM Evaluation", icon: FlaskConical },
  { path: "/observability", label: "Observability", icon: Activity },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  const [moreExpanded, setMoreExpanded] = useState(false);

  return (
    <aside className="w-56 bg-[#0d0a1a]/80 border-r border-violet-500/10 flex flex-col h-screen sticky top-0 backdrop-blur-sm">
      <div className="px-4 py-4 border-b border-violet-500/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-white tracking-tight">INCA</h1>
            <p className="text-[10px] text-violet-400/60 font-mono uppercase tracking-widest">AI Research</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {primaryNavItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path}>
              <div className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer relative",
                isActive
                  ? "bg-violet-500/12 text-violet-300"
                  : "text-violet-400/50 hover:text-violet-200 hover:bg-violet-500/8"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-400 rounded-r-full" />
                )}
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </div>
            </Link>
          );
        })}

        <div className="pt-2">
          <button
            onClick={() => setMoreExpanded(!moreExpanded)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-violet-400/30 hover:text-violet-300 hover:bg-violet-500/5 transition-all w-full"
          >
            <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", moreExpanded && "rotate-90")} />
            More tools
          </button>
          {moreExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {secondaryNavItems.map(({ path, label, icon: Icon }) => {
                const isActive = path === "/" ? location === "/" : location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer relative ml-2",
                      isActive
                        ? "bg-violet-500/12 text-violet-300"
                        : "text-violet-400/30 hover:text-violet-200 hover:bg-violet-500/5"
                    )}>
                      <Icon className="w-3 h-3 shrink-0" />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-violet-500/10 space-y-2">
        <UserButton showName className="w-full" />
        <div className="flex items-center gap-2 text-[10px] text-violet-400/25">
          <Brain className="w-3 h-3" />
          <span className="font-mono">SZL Holdings</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/experiments" component={Experiments} />
        <Route path="/models" component={Models} />
        <Route path="/insights" component={Insights} />
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
  { id: "nav-dashboard", label: "Dashboard", icon: "🧠", group: "Navigation", keywords: ["home", "overview"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-projects", label: "Projects", icon: "📁", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/projects"); } },
  { id: "nav-experiments", label: "Experiments", icon: "🧪", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/experiments"); } },
  { id: "nav-models", label: "Models", icon: "⚙️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/models"); } },
  { id: "nav-insights", label: "Insights", icon: "💡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/insights"); } },
  { id: "nav-gpu", label: "GPU Monitor", icon: "🖥️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/gpu-monitoring"); } },
  { id: "nav-registry", label: "Model Registry", icon: "📦", group: "Research Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/registry"); } },
  { id: "nav-predictions", label: "Predictions", icon: "📈", group: "Research Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/predictions"); } },
  { id: "nav-ensemble", label: "Ensemble Studio", icon: "🎛️", group: "Research Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ensemble"); } },
  { id: "nav-neural", label: "Neural Explorer", icon: "🔬", group: "Research Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/neural-explorer"); } },
  { id: "nav-llm", label: "LLM Evaluation", icon: "🤖", group: "Research Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/llm-eval"); } },
  { id: "nav-benchmarking", label: "Benchmarking", icon: "🏆", group: "Research Tools", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/benchmarking"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-lyte", label: "Switch to Lyte", icon: "⚡", group: "Switch App", description: "Command Center", action: () => { window.location.href = "/lyte-command-center/"; } },
];

const incaShortcuts: KeyboardShortcut[] = [
  { key: "E", description: "Go to Experiments", category: "Navigation" },
  { key: "M", description: "Go to Models", category: "Navigation" },
  { key: "P", description: "Go to Predictions", category: "Navigation" },
  { key: "G", description: "Go to GPU Monitor", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(incaCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={incaShortcuts} appName="INCA" accentColor="#8b5cf6">
          <div className="flex flex-col h-screen bg-background">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium">
              Skip to main content
            </a>
            <EcosystemNav currentAppId="inca" currentAppName="INCA AI Research Command Center" accentColor="#8b5cf6" />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
                <AppRouter />
              </main>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={incaCommands}
            appName="INCA"
            accentColor="#8b5cf6"
          />
        </PowerUserProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
