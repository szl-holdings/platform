import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { Brain, FlaskConical, LayoutDashboard, FolderKanban, Lightbulb, Cpu, Beaker, TrendingUp, BellRing, Layers, Activity, Eye, Link2, BarChart3, Boxes, GitBranch, Database, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

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
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/experiments", label: "Experiments", icon: FlaskConical },
  { path: "/models", label: "Models", icon: Cpu },
  { path: "/insights", label: "Insights", icon: Lightbulb },
  { path: "/gpu-monitoring", label: "GPU Monitor", icon: Cpu },
];

const secondaryNavItems = [
  { path: "/observability", label: "Observability", icon: Activity },
  { path: "/predictions", label: "Predictions", icon: TrendingUp },
  { path: "/alerts", label: "Alerts", icon: BellRing },
  { path: "/ensemble", label: "Ensemble Studio", icon: Layers },
  { path: "/drift", label: "Prediction Drift", icon: Activity },
  { path: "/anomalies", label: "Anomaly Timeline", icon: Eye },
  { path: "/correlation-alerts", label: "Alert Correlation", icon: Link2 },
  { path: "/confidence", label: "Confidence", icon: BarChart3 },
  { path: "/scenarios", label: "Scenario Builder", icon: Boxes },
  { path: "/correlations", label: "Correlations", icon: GitBranch },
  { path: "/registry", label: "Model Registry", icon: Database },
  { path: "/neural-explorer", label: "Neural Explorer", icon: Brain },
  { path: "/benchmarking", label: "Benchmarking", icon: Trophy },
  { path: "/llm-eval", label: "LLM Evaluation", icon: FlaskConical },
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
    <aside className="w-56 bg-card/50 border-r border-border flex flex-col h-screen sticky top-0 backdrop-blur-sm">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-primary animate-neural-pulse" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-foreground tracking-tight">INCA</h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.1em]">AI Research</p>
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
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-all w-full"
          >
            <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", moreExpanded && "rotate-90")} />
            More pages
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
                        ? "bg-primary/12 text-primary"
                        : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
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

      <div className="px-4 py-3 border-t border-border space-y-2">
        <UserButton showName className="w-full" />
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
          <Beaker className="w-3 h-3" />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="flex flex-col h-screen bg-background">
          <EcosystemNav currentAppId="inca" currentAppName="INCA AI Research Command Center" accentColor="#8b5cf6" />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <AppRouter />
            </main>
          </div>
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
