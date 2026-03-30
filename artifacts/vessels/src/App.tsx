import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { Ship, Anchor, Navigation, AlertTriangle, CloudRain, Activity, LayoutDashboard, Server, Wifi, WifiOff, BarChart3, Cog, ScrollText, Package, ShieldCheck, Leaf, Brain, Globe, User, ChevronDown } from "lucide-react";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { helmsmanConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth, roleLabels, type UserRole } from "@/contexts/auth-context";

const FleetDashboard = lazy(() => import("@/pages/fleet-dashboard"));
const VesselDetailPage = lazy(() => import("@/pages/vessel-detail"));
const RoutePlanningPage = lazy(() => import("@/pages/route-planning"));
const AlertCenterPage = lazy(() => import("@/pages/alert-center"));
const WeatherPage = lazy(() => import("@/pages/weather-page"));
const SimulationsPage = lazy(() => import("@/pages/simulations-page"));
const MaritimeIntelligence = lazy(() => import("@/pages/maritime-intelligence"));
const VesselsIntelligence = lazy(() => import("@/pages/intelligence"));
const FleetAPMPage = lazy(() => import("@/pages/fleet-apm"));
const InfrastructurePage = lazy(() => import("@/pages/infrastructure"));
const LogsExplorerPage = lazy(() => import("@/pages/logs-explorer"));
const DigitalExperiencePage = lazy(() => import("@/pages/digital-experience"));
const SyntheticsCompliancePage = lazy(() => import("@/pages/synthetics-compliance"));
const CO2EmissionsPage = lazy(() => import("@/pages/co2-emissions"));
const AppliedIntelligencePage = lazy(() => import("@/pages/applied-intelligence"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const PortAnalyticsPage = lazy(() => import("@/pages/port-analytics"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

interface NavSection {
  title: string;
  items: { path: string; label: string; icon: typeof LayoutDashboard; roles?: UserRole[] }[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { path: "/", label: "Command Center", icon: LayoutDashboard },
      { path: "/intelligence", label: "Maritime Intel", icon: Globe },
      { path: "/fleet-apm", label: "Fleet APM", icon: BarChart3 },
    ],
  },
  {
    title: "Operations",
    items: [
      { path: "/infrastructure", label: "Infrastructure", icon: Cog, roles: ["ops", "maintenance", "exec"] },
      { path: "/routes", label: "Route Planning", icon: Navigation, roles: ["ops", "exec"] },
      { path: "/weather", label: "Weather Impact", icon: CloudRain, roles: ["ops", "exec"] },
      { path: "/simulations", label: "Simulations", icon: Activity, roles: ["ops", "exec"] },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { path: "/logs", label: "Logs Explorer", icon: ScrollText },
      { path: "/alerts", label: "Alert Center", icon: AlertTriangle },
      { path: "/digital-experience", label: "Digital Experience", icon: Package, roles: ["ops", "exec"] },
    ],
  },
  {
    title: "Compliance & Environment",
    items: [
      { path: "/synthetics", label: "Synthetics/Compliance", icon: ShieldCheck, roles: ["compliance", "exec"] },
      { path: "/co2-emissions", label: "CO2 & Emissions", icon: Leaf, roles: ["compliance", "exec", "ops"] },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { path: "/applied-intelligence", label: "Applied Intelligence", icon: Brain },
      { path: "/ai-intel", label: "AI Intelligence", icon: Brain },
      { path: "/observability", label: "Observability", icon: Activity },
      { path: "/port-analytics", label: "Port Analytics", icon: Anchor },
    ],
  },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
      <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center gap-2 shrink-0">
        <WifiOff className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400 font-medium">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 shrink-0">
      <Server className="w-4 h-4 text-amber-400" />
      <span className="text-xs text-amber-400 font-medium">Demo Mode</span>
      <span className="text-xs text-amber-400/60">— {demoNames.join(", ")} using simulated data</span>
    </div>
  );
}

function RoleSelector() {
  const { user, setRole } = useAuth();
  const [open, setOpen] = useState(false);
  const roles: UserRole[] = ["exec", "ops", "compliance", "maintenance"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{user.name}</p>
          <p className="text-[10px] text-muted-foreground">{roleLabels[user.role]}</p>
        </div>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2">Switch Role</p>
          </div>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs transition-colors",
                user.role === r ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

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
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item => !item.roles || item.roles.includes(user.role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 mb-1.5 font-medium">{section.title}</p>
              <div className="space-y-0.5">
                {visibleItems.map(({ path, label, icon: Icon }) => {
                  const isActive = path === "/" ? location === "/" : location.startsWith(path);
                  return (
                    <Link key={path} href={path}>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden",
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
              </div>
            </div>
          );
        })}
      </nav>
      <IntegrationStatusFooter />
      <div className="border-t border-border">
        <RoleSelector />
      </div>
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
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={FleetDashboard} />
        <Route path="/intelligence" component={MaritimeIntelligence} />
        <Route path="/ai-intel" component={VesselsIntelligence} />
        <Route path="/fleet-apm" component={FleetAPMPage} />
        <Route path="/infrastructure" component={InfrastructurePage} />
        <Route path="/logs" component={LogsExplorerPage} />
        <Route path="/digital-experience" component={DigitalExperiencePage} />
        <Route path="/synthetics" component={SyntheticsCompliancePage} />
        <Route path="/co2-emissions" component={CO2EmissionsPage} />
        <Route path="/applied-intelligence" component={AppliedIntelligencePage} />
        <Route path="/port-analytics" component={PortAnalyticsPage} />
        <Route path="/vessel/:id" component={VesselDetailPage} />
        <Route path="/routes" component={RoutePlanningPage} />
        <Route path="/weather" component={WeatherPage} />
        <Route path="/simulations" component={SimulationsPage} />
        <Route path="/alerts" component={AlertCenterPage} />
        <Route path="/observability" component={ObservabilityPage} />
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
      <AuthProvider>
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
      </AuthProvider>
      <AgentCopilot config={helmsmanConfig} />
    </QueryClientProvider>
  );
}

export default App;
