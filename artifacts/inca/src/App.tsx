import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Brain, FlaskConical, LayoutDashboard, FolderKanban, Lightbulb, Cpu, Beaker, TrendingUp, BellRing, Layers, Activity, Eye, Link2, BarChart3, Boxes, GitBranch, Database, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Experiments from "@/pages/experiments";
import Models from "@/pages/models";
import Insights from "@/pages/insights";
import ObservabilityPage from "@/pages/observability";
import Predictions from "@/pages/predictions";
import AlertsManagement from "@/pages/alerts-management";
import EnsembleStudio from "@/pages/ensemble-studio";
import PredictionDrift from "@/pages/prediction-drift";
import AnomalyTimeline from "@/pages/anomaly-timeline";
import AlertCorrelation from "@/pages/alert-correlation";
import ConfidenceHistogram from "@/pages/confidence-histogram";
import ScenarioBuilder from "@/pages/scenario-builder";
import CorrelationAnalysis from "@/pages/correlation-analysis";
import ModelRegistry from "@/pages/model-registry";
import NeuralExplorer from "@/pages/neural-explorer";
import Benchmarking from "@/pages/benchmarking";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, section: "Core" },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/experiments", label: "Experiments", icon: FlaskConical },
  { path: "/models", label: "Models", icon: Cpu },
  { path: "/insights", label: "Insights", icon: Lightbulb },
  { path: "/observability", label: "Observability", icon: Activity, section: "Monitoring" },
  { path: "/predictions", label: "Predictions", icon: TrendingUp, section: "Predictive AI" },
  { path: "/alerts", label: "Alerts", icon: BellRing },
  { path: "/ensemble", label: "Ensemble Studio", icon: Layers },
  { path: "/drift", label: "Prediction Drift", icon: Activity },
  { path: "/anomalies", label: "Anomaly Timeline", icon: Eye },
  { path: "/correlation-alerts", label: "Alert Correlation", icon: Link2 },
  { path: "/confidence", label: "Confidence", icon: BarChart3, section: "Analysis" },
  { path: "/scenarios", label: "Scenario Builder", icon: Boxes },
  { path: "/correlations", label: "Correlations", icon: GitBranch },
  { path: "/registry", label: "Model Registry", icon: Database },
  { path: "/neural-explorer", label: "Neural Explorer", icon: Brain },
  { path: "/benchmarking", label: "Benchmarking", icon: Trophy },
];

function Sidebar() {
  const [location] = useLocation();
  let currentSection = "";
  return (
    <aside className="w-[260px] bg-card/50 border-r border-border flex flex-col h-screen sticky top-0 backdrop-blur-sm">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary animate-neural-pulse" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground tracking-tight">INCA</h1>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.15em]">AI Research Command</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon, section }) => {
          const showSection = section && section !== currentSection;
          if (section) currentSection = section;
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <div key={path}>
              {showSection && (
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 pt-4 pb-1.5">
                  {section}
                </div>
              )}
              <Link href={path}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden",
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                  )}
                  <Icon className={cn("w-4 h-4 transition-transform duration-200", isActive && "scale-110")} />
                  {label}
                </div>
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Beaker className="w-3 h-3" />
          <span className="font-mono text-[10px]">SZL Holdings · Research Division</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
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
      <Route>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground font-mono">404 — Page not found</p>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
