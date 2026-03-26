import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Ship, Anchor, Navigation, AlertTriangle, CloudRain, Activity, LayoutDashboard, Server, Wifi, WifiOff } from "lucide-react";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { helmsmanConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@/lib/utils";
import FleetDashboard from "@/pages/fleet-dashboard";
import VesselDetailPage from "@/pages/vessel-detail";
import RoutePlanningPage from "@/pages/route-planning";
import AlertCenterPage from "@/pages/alert-center";
import WeatherPage from "@/pages/weather-page";
import SimulationsPage from "@/pages/simulations-page";
import MaritimeIntelligence from "@/pages/maritime-intelligence";
import { Globe } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const navItems = [
  { path: "/", label: "Fleet Dashboard", icon: LayoutDashboard },
  { path: "/intelligence", label: "Maritime Intel", icon: Globe },
  { path: "/routes", label: "Route Planning", icon: Navigation },
  { path: "/weather", label: "Weather Impact", icon: CloudRain },
  { path: "/simulations", label: "Simulations", icon: Activity },
  { path: "/alerts", label: "Alert Center", icon: AlertTriangle },
];

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function IntegrationStatusFooter() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-vessels"],
    queryFn: () => fetch("/api/services/health/app/vessels").then((r) => r.json()),
    refetchInterval: 60000,
  });

  if (!data) return null;

  const { summary } = data;
  const hasUnhealthy = summary.manualRequired > 0;

  return (
    <div className="p-3 border-t border-border space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Integrations</div>
      <div className="flex flex-wrap gap-1">
        {data.services.map((svc) => (
          <span
            key={svc.name}
            className={cn(
              "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors",
              svc.status === "LIVE_CONFIGURED" ? "bg-emerald-500/10 text-emerald-400" :
              svc.status === "MOCKED_DEMO_MODE" ? "bg-amber-500/10 text-amber-400" :
              "bg-red-500/10 text-red-400"
            )}
          >
            {svc.status === "LIVE_CONFIGURED" ? <Wifi className="w-2.5 h-2.5" /> :
             svc.status === "MOCKED_DEMO_MODE" ? <Server className="w-2.5 h-2.5" /> :
             <WifiOff className="w-2.5 h-2.5" />}
            {svc.name}
          </span>
        ))}
      </div>
      {hasUnhealthy && (
        <div className="text-xs text-red-400">{summary.manualRequired} not configured</div>
      )}
    </div>
  );
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-vessels"],
    queryFn: () => fetch("/api/services/health/app/vessels").then((r) => r.json()),
    refetchInterval: 60000,
  });

  if (!data) return null;

  const hasDemoMode = data.summary.mockedDemoMode > 0;
  const hasUnhealthy = data.summary.manualRequired > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;

  const demoNames = data.services.filter((s) => s.status === "MOCKED_DEMO_MODE").map((s) => s.name);

  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400 font-medium">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2">
      <Server className="w-4 h-4 text-amber-400" />
      <span className="text-xs text-amber-400 font-medium">Demo Mode</span>
      <span className="text-xs text-amber-400/60">— {demoNames.join(", ")} using simulated data</span>
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
            <Ship className="w-5 h-5 text-primary animate-wave-float" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Vessels</h1>
            <p className="text-xs text-muted-foreground">Maritime Intelligence</p>
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
      <IntegrationStatusFooter />
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Anchor className="w-3 h-3" />
          <span>SZL Holdings Platform</span>
        </div>
      </div>
    </aside>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={FleetDashboard} />
      <Route path="/intelligence" component={MaritimeIntelligence} />
      <Route path="/vessel/:id" component={VesselDetailPage} />
      <Route path="/routes" component={RoutePlanningPage} />
      <Route path="/weather" component={WeatherPage} />
      <Route path="/simulations" component={SimulationsPage} />
      <Route path="/alerts" component={AlertCenterPage} />
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
          <div className="flex-1 flex flex-col overflow-auto">
            <DemoModeBanner />
            <main className="flex-1 overflow-auto">
              <AppRouter />
            </main>
          </div>
        </div>
        <Toaster />
      </WouterRouter>
      <AgentCopilot config={helmsmanConfig} />
    </QueryClientProvider>
  );
}

export default App;
