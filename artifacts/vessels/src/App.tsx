import { lazy, Suspense, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { Ship, Anchor, Navigation, AlertTriangle, CloudRain, Activity, LayoutDashboard, Server, Wifi, WifiOff, BarChart3, Cog, ScrollText, Package, ShieldCheck, Leaf, Brain, Globe, User, ChevronDown, EyeOff, ShieldAlert, Shield, ChevronRight } from "lucide-react";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { helmsmanConfig } from "@workspace/shared-ui/copilot-configs";
import { cn } from "@workspace/shared-ui/utils";
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
const DarkVesselDetection = lazy(() => import("@/pages/dark-vessel-detection"));
const CommoditiesTracking = lazy(() => import("@/pages/commodities-tracking"));
const RiskScoringPage = lazy(() => import("@/pages/risk-scoring"));
const SanctionsScreening = lazy(() => import("@/pages/sanctions-screening"));
const CyberThreatPanel = lazy(() => import("@/pages/cyber-threat-panel"));
const IncidentReporting = lazy(() => import("@/pages/incident-reporting"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const primaryNavItems = [
  { path: "/", label: "Fleet Command", icon: LayoutDashboard },
  { path: "/intelligence", label: "Maritime Intel", icon: Globe },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/routes", label: "Route Planning", icon: Navigation },
  { path: "/fleet-apm", label: "Fleet APM", icon: BarChart3 },
  { path: "/weather", label: "Weather", icon: CloudRain },
];

const secondaryNavItems = [
  { path: "/risk-scoring", label: "Risk Scoring", icon: Shield },
  { path: "/dark-vessel-detection", label: "Dark Vessels", icon: EyeOff },
  { path: "/sanctions-screening", label: "Sanctions", icon: ShieldAlert },
  { path: "/co2-emissions", label: "CO2 & Emissions", icon: Leaf },
  { path: "/cyber-threats", label: "Cyber Threats", icon: ShieldCheck },
  { path: "/incidents", label: "Incidents", icon: AlertTriangle },
  { path: "/port-analytics", label: "Port Analytics", icon: Anchor },
  { path: "/observability", label: "Observability", icon: Activity },
  { path: "/logs", label: "Logs", icon: ScrollText },
  { path: "/simulations", label: "Simulations", icon: Activity },
  { path: "/applied-intelligence", label: "Applied AI", icon: Brain },
  { path: "/commodities-tracking", label: "Commodities", icon: Package },
  { path: "/infrastructure", label: "Infrastructure", icon: Cog },
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

  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <WifiOff className="w-3 h-3 text-red-400" />
        <span className="text-[11px] text-red-400">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }

  return (
    <div className="border-b border-sky-500/10 px-4 py-1 flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-mono text-sky-400/50 px-2 py-0.5 rounded-full border border-sky-500/20 bg-sky-500/5">DEMO</span>
      <span className="text-[10px] text-sky-400/40">Simulated data</span>
    </div>
  );
}

function RoleSelector({ expanded }: { expanded: boolean }) {
  const { user, setRole } = useAuth();
  const [open, setOpen] = useState(false);
  const roles: UserRole[] = ["exec", "ops", "compliance", "maintenance"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-sky-500/5 transition-colors text-left"
        aria-label={`Current role: ${roleLabels[user.role]}`}
      >
        <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-sky-400" />
        </div>
        {expanded && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sky-100 truncate">{user.name}</p>
              <p className="text-[10px] text-sky-400/50">{roleLabels[user.role]}</p>
            </div>
            <ChevronDown className={cn("w-3 h-3 text-sky-400/40 transition-transform shrink-0", open && "rotate-180")} />
          </>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#0a1628] border border-sky-500/20 rounded-lg shadow-xl z-50 overflow-hidden" style={{ minWidth: 160 }}>
          <div className="p-2 border-b border-sky-500/10">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider px-2">Switch Role</p>
          </div>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs transition-colors",
                user.role === r ? "bg-sky-500/10 text-sky-400" : "text-sky-300/50 hover:text-sky-100 hover:bg-sky-500/5"
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
  const [hovered, setHovered] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const expanded = hovered;

  return (
    <aside
      className={cn(
        "bg-[#060e1a]/95 border-r border-sky-500/10 flex flex-col h-screen sticky top-0 transition-all duration-200 ease-out z-30",
        expanded ? "w-52" : "w-14"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMoreExpanded(false); }}
    >
      {/* Logo */}
      <div className="px-3 py-4 border-b border-sky-500/10 flex items-center gap-2.5 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
          <Ship className="w-4 h-4 text-sky-400 animate-wave-float" />
        </div>
        {expanded && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="font-display text-sm font-bold text-sky-50 truncate">Vessels</h1>
            <p className="text-[10px] text-sky-400/50 truncate">Maritime Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {primaryNavItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path}>
              <div
                className={cn(
                  "flex items-center rounded-lg transition-all duration-150 cursor-pointer relative",
                  expanded ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5",
                  isActive
                    ? "bg-sky-500/10 text-sky-300"
                    : "text-sky-400/50 hover:text-sky-200 hover:bg-sky-500/5"
                )}
                title={!expanded ? label : undefined}
              >
                {isActive && expanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-400 rounded-r-full" />
                )}
                <Icon className={cn("shrink-0", expanded ? "w-3.5 h-3.5" : "w-5 h-5")} />
                {expanded && <span className="text-xs font-medium truncate">{label}</span>}
              </div>
            </Link>
          );
        })}

        {expanded && (
          <div className="pt-2">
            <button
              onClick={() => setMoreExpanded(!moreExpanded)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sky-400/40 hover:text-sky-300 hover:bg-sky-500/5 transition-all w-full"
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
                          ? "bg-sky-500/10 text-sky-300"
                          : "text-sky-400/40 hover:text-sky-200 hover:bg-sky-500/5"
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
        )}
      </nav>

      {/* Footer */}
      <div className="px-1.5 py-3 border-t border-sky-500/10">
        <RoleSelector expanded={expanded} />
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
        <Route path="/dark-vessel-detection" component={DarkVesselDetection} />
        <Route path="/commodities-tracking" component={CommoditiesTracking} />
        <Route path="/risk-scoring" component={RiskScoringPage} />
        <Route path="/sanctions-screening" component={SanctionsScreening} />
        <Route path="/cyber-threats" component={CyberThreatPanel} />
        <Route path="/incidents" component={IncidentReporting} />
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
          <div className="flex flex-col h-screen bg-[#060e1a]">
            <EcosystemNav currentAppId="vessels" currentAppName="Vessels Maritime Intelligence" accentColor="#3b82f6" />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-auto min-w-0">
                <DemoModeBanner />
                <main className="flex-1 overflow-auto">
                  <AppRouter />
                </main>
              </div>
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
