import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { Flame, Shield, Target, BarChart3, FileText, Activity, AlertTriangle, Bell, Grid3X3, ClipboardCheck, Search, Rss } from "lucide-react";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { sentinelConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@/lib/utils";

const SOCDashboard = lazy(() => import("@/pages/soc-dashboard"));
const ThreatIntelligence = lazy(() => import("@/pages/threat-intelligence"));
const ThreatIntelFeed = lazy(() => import("@/pages/threat-intel-feed"));
const IncidentsPage = lazy(() => import("@/pages/incidents-page"));
const FindingsPage = lazy(() => import("@/pages/findings-page"));
const MitreAttackPage = lazy(() => import("@/pages/mitre-attack-page"));
const CompliancePage = lazy(() => import("@/pages/compliance-page"));
const AlertsPage = lazy(() => import("@/pages/alerts-page"));
const RiskScoringPage = lazy(() => import("@/pages/risk-scoring"));
const ReportsPage = lazy(() => import("@/pages/reports-page"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const SentinelDashboard = lazy(() => import("@/pages/sentinel-dashboard"));
const Watchlists = lazy(() => import("@/pages/watchlists"));
const ForensicsTimeline = lazy(() => import("@/pages/forensics-timeline"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const navItems = [
  { path: "/", label: "SOC Dashboard", icon: Activity },
  { path: "/threat-intel", label: "Threat Intel", icon: AlertTriangle },
  { path: "/threat-feed", label: "Threat Feed", icon: Rss },
  { path: "/incidents", label: "Incidents", icon: Shield },
  { path: "/findings", label: "Findings", icon: Target },
  { path: "/mitre-attack", label: "MITRE ATT&CK", icon: Grid3X3 },
  { path: "/compliance", label: "Compliance", icon: ClipboardCheck },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/risk-scoring", label: "Risk Scoring", icon: BarChart3 },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/observability", label: "Observability", icon: Search },
  { path: "/sentinel", label: "Sentinel Watch", icon: Search },
  { path: "/watchlists", label: "Watchlists", icon: Target },
  { path: "/forensics", label: "Forensics", icon: Flame },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StatusBar() {
  const { data: socData } = useQuery({
    queryKey: ["soc-dashboard"],
    queryFn: () => fetch("/api/firestorm/soc-dashboard").then(r => r.json()),
    refetchInterval: 30000,
  });

  const alertCount = socData?.openAlerts || 0;
  const incidentCount = socData?.activeIncidents || 0;

  return (
    <div className="h-8 bg-card/50 border-b border-border flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Systems Operational
        </span>
      </div>
      <div className="flex items-center gap-4 text-muted-foreground">
        <span className={`flex items-center gap-1 ${alertCount > 0 ? "text-amber-400" : ""}`}>
          <Bell className="w-3 h-3" /> {alertCount} alerts
        </span>
        <span className={`flex items-center gap-1 ${incidentCount > 0 ? "text-red-400" : ""}`}>
          <Shield className="w-3 h-3" /> {incidentCount} active
        </span>
      </div>
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Firestorm</h1>
            <p className="text-xs text-muted-foreground">Security Operations</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-0.5"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <Icon className={cn("w-4 h-4 transition-transform duration-200", isActive && "scale-110")} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="w-3 h-3" />
          <span>SZL Holdings Platform</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={SOCDashboard} />
        <Route path="/threat-intel" component={ThreatIntelligence} />
        <Route path="/threat-feed" component={ThreatIntelFeed} />
        <Route path="/incidents" component={IncidentsPage} />
        <Route path="/findings" component={FindingsPage} />
        <Route path="/mitre-attack" component={MitreAttackPage} />
        <Route path="/compliance" component={CompliancePage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/risk-scoring" component={RiskScoringPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/sentinel" component={SentinelDashboard} />
        <Route path="/watchlists" component={Watchlists} />
        <Route path="/forensics" component={ForensicsTimeline} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Page not found</p>
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
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-auto">
            <StatusBar />
            <main className="flex-1 overflow-auto">
              <AppRouter />
            </main>
          </div>
        </div>
        <Toaster />
      </WouterRouter>
      <AgentCopilot config={sentinelConfig} />
    </QueryClientProvider>
  );
}

export default App;
