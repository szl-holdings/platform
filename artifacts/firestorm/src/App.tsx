import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Flame, Shield, Target, Search, BarChart3, FileText, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import AssessmentDashboard from "@/pages/assessment-dashboard";
import ScenarioLibrary from "@/pages/scenario-library";
import SimulationRunner from "@/pages/simulation-runner";
import FindingsPage from "@/pages/findings-page";
import RiskScoringPage from "@/pages/risk-scoring";
import ReportsPage from "@/pages/reports-page";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const navItems = [
  { path: "/", label: "Assessments", icon: LayoutDashboard },
  { path: "/scenarios", label: "Scenario Library", icon: Target },
  { path: "/simulations", label: "Simulation Runner", icon: Search },
  { path: "/findings", label: "Findings", icon: Shield },
  { path: "/risk-scoring", label: "Risk Scoring", icon: BarChart3 },
  { path: "/reports", label: "Reports", icon: FileText },
];

function Sidebar() {
  const [location] = useLocation();
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Firestorm</h1>
            <p className="text-xs text-muted-foreground">Security Simulation</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>Controlled Simulation Mode</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={AssessmentDashboard} />
      <Route path="/scenarios" component={ScenarioLibrary} />
      <Route path="/simulations" component={SimulationRunner} />
      <Route path="/findings" component={FindingsPage} />
      <Route path="/risk-scoring" component={RiskScoringPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Page not found</p>
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
        <Toaster />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
